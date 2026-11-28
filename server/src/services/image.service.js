import sharp from 'sharp';
import {
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { s3Client, R2_BUCKET_NAME, R2_CUSTOM_DOMAIN } from '../config/r2.js';

export const imageService = {
  /**
   * Get all folder prefixes in the R2 bucket
   */
  getFolders: async () => {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Delimiter: '/'
    });

    const data = await s3Client.send(command);
    const folders = (data.CommonPrefixes || []).map((cp) =>
      cp.Prefix.replace(/\/$/, '')
    ).filter(Boolean);

    return folders;
  },

  /**
   * Create a new folder (by placing a .keep marker)
   */
  createFolder: async (folderName) => {
    if (!folderName) {
      throw new Error('Tên thư mục không được để trống.');
    }

    const cleanFolderName = folderName
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '');

    if (!cleanFolderName) {
      throw new Error('Tên thư mục chứa ký tự không hợp lệ.');
    }

    const fileKey = `${cleanFolderName}/.keep`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: '',
        ContentType: 'text/plain'
      })
    );

    return cleanFolderName;
  },

  /**
   * Delete entire folder and all objects inside
   */
  deleteFolder: async (folderName) => {
    if (!folderName) throw new Error('Tên thư mục không được để trống.');

    const cleanName = folderName.replace(/\/+$/, '');

    // 1. List all objects with prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `${cleanName}/`
    });

    const listData = await s3Client.send(listCommand);

    if (!listData.Contents || listData.Contents.length === 0) {
      return { deletedCount: 0 };
    }

    // 2. Bulk delete in batches of up to 1000
    const objectsToDelete = listData.Contents.map((item) => ({ Key: item.Key }));
    const deleteParams = {
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: objectsToDelete
      }
    };

    await s3Client.send(new DeleteObjectsCommand(deleteParams));
    return { deletedCount: objectsToDelete.length };
  },

  /**
   * Get all images within a folder
   */
  getImages: async (folder = '') => {
    const cleanFolder = folder.replace(/\/+$/, '');
    const prefix = cleanFolder ? `${cleanFolder}/` : '';

    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix
    });

    const data = await s3Client.send(command);
    const rawFiles = data.Contents || [];

    const files = rawFiles
      .filter((item) => !item.Key.endsWith('/') && !item.Key.endsWith('.keep'))
      .map((item) => {
        const fileName = item.Key.split('/').pop();
        return {
          key: item.Key,
          name: fileName,
          url: `${R2_CUSTOM_DOMAIN}/${item.Key}`,
          lastModified: item.LastModified,
          size: item.Size
        };
      })
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

    return {
      folder: cleanFolder,
      files,
      total: files.length,
      totalSize
    };
  },

  /**
   * Upload multiple images, convert each to optimized WebP format
   */
  uploadImages: async (files, folder) => {
    if (!files || files.length === 0) {
      throw new Error('Chưa chọn hình ảnh để tải lên.');
    }
    if (!folder) {
      throw new Error('Chưa chọn thư mục đích.');
    }

    const cleanFolder = folder.trim().replace(/[^a-zA-Z0-9_-]/g, '');

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const originalName = file.originalname || 'image';
        const nameWithoutExt =
          originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const cleanName = nameWithoutExt
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9_-]/g, '') || `img_${Date.now()}`;

        const fileKey = `${cleanFolder}/${cleanName}.webp`;

        // Process buffer via sharp to WebP (quality 80 for optimal compression/clarity)
        const processedBuffer = await sharp(file.buffer)
          .webp({ quality: 80 })
          .toBuffer();

        await s3Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
            Body: processedBuffer,
            ContentType: 'image/webp'
          })
        );

        return {
          key: fileKey,
          name: `${cleanName}.webp`,
          url: `${R2_CUSTOM_DOMAIN}/${fileKey}`,
          size: processedBuffer.length
        };
      })
    );

    return uploadResults;
  },

  /**
   * Replace/overwrite a single image by exact key
   */
  updateSingle: async (file, key) => {
    if (!file) throw new Error('Chưa chọn tệp tin thay thế.');
    if (!key) throw new Error('Thiếu Key tệp tin cần thay thế.');

    const processedBuffer = await sharp(file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: processedBuffer,
        ContentType: 'image/webp'
      })
    );

    return {
      key,
      url: `${R2_CUSTOM_DOMAIN}/${key}`,
      size: processedBuffer.length
    };
  },

  /**
   * Delete a single image by key
   */
  deleteSingle: async (key) => {
    if (!key) throw new Error('Thiếu Key tệp tin cần xóa.');

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
      })
    );

    return { key };
  },

  /**
   * Get overall bucket storage statistics
   */
  getStats: async () => {
    let totalSize = 0;
    let totalFiles = 0;
    let isTruncated = true;
    let continuationToken;

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken
      });

      const data = await s3Client.send(command);
      (data.Contents || []).forEach((item) => {
        if (!item.Key.endsWith('/') && !item.Key.endsWith('.keep')) {
          totalSize += item.Size;
          totalFiles += 1;
        }
      });

      isTruncated = Boolean(data.IsTruncated);
      continuationToken = data.NextContinuationToken;
    }

    return {
      totalSize,
      totalFiles,
      maxFreeStorageBytes: 10 * 1024 * 1024 * 1024 // 10 GB
    };
  }
};
