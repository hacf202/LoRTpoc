import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  UploadCloud,
  Search,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Edit3,
  Copy,
  FolderPlus,
  FolderMinus,
  Image as ImageIcon,
  X,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  HardDrive,
  Folder,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Eye
} from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function ImageManager({
  adminFolder = '',
  onSelectFolder,
  adminFetch,
  isEn = false
}) {
  const currentFolder = adminFolder || '';

  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Storage stats
  const [bucketStats, setBucketStats] = useState({ totalSize: 0, totalFiles: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  // View & Search filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [zoomLevel, setZoomLevel] = useState(3); // 1 (many small) to 5 (few large)

  // Drag & Drop / Staged Upload files
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Modals & Notifications
  const [toast, setToast] = useState(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteFolderModalOpen, setDeleteFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteImageTarget, setDeleteImageTarget] = useState(null);

  // Single image update state
  const [updatingKey, setUpdatingKey] = useState(null);
  const fileInputRef = useRef(null);
  const updateFileInputRef = useRef(null);

  // Show Toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Debounce search input by 350ms (Rule 9)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Folders List
  const loadFolders = useCallback(async () => {
    try {
      const res = await adminFetch('/api/v1/images/folders');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFolders(json.data.folders || []);
        }
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }, [adminFetch]);

  // Fetch Bucket Storage Stats
  const loadBucketStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminFetch('/api/v1/images/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBucketStats(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load bucket stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [adminFetch]);

  // Fetch Images in Current Folder
  const loadImages = useCallback(async () => {
    if (!currentFolder) {
      setImages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await adminFetch(`/api/v1/images?folder=${encodeURIComponent(currentFolder)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setImages(json.data.files || []);
        }
      }
    } catch (err) {
      console.error('Failed to load images:', err);
      showToast(isEn ? 'Failed to load images' : 'Không thể tải danh sách ảnh', 'error');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, currentFolder, isEn, showToast]);

  // Initial load
  useEffect(() => {
    loadFolders();
    loadBucketStats();
  }, [loadFolders, loadBucketStats]);

  // Load images whenever currentFolder changes
  useEffect(() => {
    setSearchInput('');
    setSelectedFiles([]);
    if (currentFolder) {
      loadImages();
    }
  }, [currentFolder, loadImages]);

  // Filtered images list
  const filteredImages = useMemo(() => {
    if (!debouncedSearch) return images;
    const query = debouncedSearch.toLowerCase();
    return images.filter(
      (img) =>
        (img.name && img.name.toLowerCase().includes(query)) ||
        (img.key && img.key.toLowerCase().includes(query))
    );
  }, [images, debouncedSearch]);

  const currentFolderSize = useMemo(() => {
    return images.reduce((acc, img) => acc + (img.size || 0), 0);
  }, [images]);

  // Folder Actions
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const cleanName = newFolderName.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanName) {
      showToast(isEn ? 'Invalid folder name' : 'Tên thư mục không hợp lệ', 'error');
      return;
    }

    try {
      const res = await adminFetch('/api/v1/images/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: cleanName })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(isEn ? `Folder "${cleanName}" created` : `Đã tạo thư mục "${cleanName}"`, 'success');
        setCreateFolderModalOpen(false);
        setNewFolderName('');
        await loadFolders();
        onSelectFolder?.(cleanName);
      } else {
        showToast(json.message || 'Lỗi khi tạo thư mục', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      setLoading(true);
      const res = await adminFetch(`/api/v1/images/folders/${encodeURIComponent(folderToDelete)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(isEn ? `Deleted folder "${folderToDelete}"` : `Đã xóa thư mục "${folderToDelete}"`, 'success');
        setDeleteFolderModalOpen(false);
        setFolderToDelete('');
        if (folderToDelete === currentFolder) {
          onSelectFolder?.('');
        }
        await loadFolders();
        await loadBucketStats();
      } else {
        showToast(json.message || 'Lỗi khi xóa thư mục', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Drag & Drop Handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 20));
    }
  };
  const onFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 20));
    }
  };
  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload Batch Images
  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !currentFolder) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('folder', currentFolder);
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const res = await adminFetch('/api/v1/images/upload', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(
          isEn ? `Successfully uploaded ${selectedFiles.length} images` : `Đã tải lên ${selectedFiles.length} ảnh`,
          'success'
        );
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadImages();
        await loadBucketStats();
      } else {
        showToast(json.message || 'Lỗi khi tải ảnh lên', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Single Image Update
  const handleUpdateChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !updatingKey) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('key', updatingKey);
      formData.append('image', file);

      const res = await adminFetch('/api/v1/images/update-single', {
        method: 'PUT',
        body: formData
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(isEn ? 'Image replaced successfully' : 'Đã thay thế ảnh thành công', 'success');
        await loadImages();
      } else {
        showToast(json.message || 'Lỗi khi thay thế ảnh', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      setUpdatingKey(null);
      if (updateFileInputRef.current) updateFileInputRef.current.value = '';
    }
  };

  // Delete Single Image
  const handleConfirmDeleteImage = async () => {
    if (!deleteImageTarget) return;
    try {
      const res = await adminFetch(`/api/v1/images/single?key=${encodeURIComponent(deleteImageTarget.key)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(isEn ? 'Image deleted' : 'Đã xóa ảnh', 'success');
        setImages((prev) => prev.filter((img) => img.key !== deleteImageTarget.key));
        setDeleteImageTarget(null);
        await loadBucketStats();
      } else {
        showToast(json.message || 'Lỗi khi xóa ảnh', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Copy Image Link to Clipboard
  const copyUrl = (url) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(isEn ? 'Copied image link!' : 'Đã sao chép link ảnh!', 'success');
    }
  };

  const getGridColsClass = (zoom) => {
    switch (zoom) {
      case 1:
        return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2';
      case 2:
        return 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3';
      case 3:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5';
      case 4:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4';
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5';
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5';
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col font-sans select-text bg-[#101216] text-slate-100 ${
        isDragging && currentFolder ? 'ring-2 ring-sky-500/50 ring-inset bg-sky-500/[0.02]' : ''
      }`}
      onDragOver={currentFolder ? onDragOver : undefined}
      onDragLeave={currentFolder ? onDragLeave : undefined}
      onDrop={currentFolder ? onDrop : undefined}
    >
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="p-3 sm:p-5 border-b border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          {currentFolder ? (
            <button
              type="button"
              onClick={() => onSelectFolder?.('')}
              className="p-1.5 rounded-lg bg-[#1a1e28] border border-white/10 text-slate-300 hover:text-sky-400 hover:border-sky-500/40 transition-colors cursor-pointer"
              title={isEn ? 'Back to folders' : 'Quay lại danh sách thư mục'}
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#1a1e28] border border-white/10 text-sky-400 flex items-center justify-center font-bold text-sm">
              <ImageIcon size={18} />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mb-0.5">
              <span className="hover:text-slate-200 cursor-pointer" onClick={() => onSelectFolder?.('')}>
                Media
              </span>
              <ChevronRight size={12} className="text-slate-600" />
              <span className="text-sky-400 font-semibold">{currentFolder || 'Root'}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
              {currentFolder ? currentFolder : isEn ? 'Cloudflare R2 Media Library' : 'Thư Viện Ảnh Cloudflare R2'}
            </h1>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder={currentFolder ? (isEn ? 'Search files...' : 'Tìm tệp tin...') : (isEn ? 'Search folder...' : 'Tìm thư mục...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {currentFolder ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-[#BFDDF0] transition-colors shrink-0"
            >
              <UploadCloud size={15} />
              <span>{isEn ? 'Upload' : 'Tải Lên'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCreateFolderModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-[#BFDDF0] transition-colors shrink-0"
            >
              <FolderPlus size={15} />
              <span>{isEn ? 'New Folder' : 'Tạo Thư Mục'}</span>
            </button>
          )}
        </div>
      </div>

      {/* STORAGE STATS BAR */}
      <div className="px-3 py-2.5 sm:px-5 sm:py-3 bg-[#0d0f14] border-b border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0 text-xs">
        {/* Total Storage Used */}
        <div className="bg-[#141720] border border-white/[0.06] rounded-xl p-2.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
            <HardDrive size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">R2 Storage</span>
            <span className="font-bold font-mono text-white text-xs sm:text-sm">
              {formatBytes(bucketStats.totalSize)} <span className="text-slate-500 font-normal">/ 10 GB</span>
            </span>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (bucketStats.totalSize / (10 * 1024 * 1024 * 1024)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Files */}
        <div className="bg-[#141720] border border-white/[0.06] rounded-xl p-2.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <ImageIcon size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Files</span>
            <span className="font-bold font-mono text-white text-xs sm:text-sm">
              {bucketStats.totalFiles.toLocaleString()} <span className="text-slate-500 font-normal">assets</span>
            </span>
          </div>
        </div>

        {/* Current Folder Info / Refresh */}
        {currentFolder ? (
          <div className="col-span-2 bg-[#141720] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Folder size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Folder</span>
                <span className="font-bold text-sky-400 text-xs sm:text-sm truncate block">
                  {currentFolder} <span className="text-slate-400 font-normal text-xs font-mono">({images.length} files • {formatBytes(currentFolderSize)})</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={loadImages}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title={isEn ? 'Reload images' : 'Làm mới ảnh'}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFolderToDelete(currentFolder);
                  setDeleteFolderModalOpen(true);
                }}
                className="p-1.5 text-rose-400/80 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                title={isEn ? 'Delete folder' : 'Xóa thư mục'}
              >
                <FolderMinus size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="col-span-2 bg-[#141720] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-slate-400 text-xs">
              {folders.length} {isEn ? 'folders in bucket' : 'thư mục trong hệ thống'}
            </span>
            <button
              type="button"
              onClick={() => {
                loadFolders();
                loadBucketStats();
              }}
              className="px-2.5 py-1 text-slate-300 hover:text-sky-400 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <RefreshCw size={13} className={statsLoading ? 'animate-spin' : ''} />
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW CONTROLS (Inside Folder) */}
      {currentFolder && (
        <div className="px-3 py-2 sm:px-5 border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0 bg-[#12151d]">
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-[#181b24] p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#8CC0EB] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Lưới (Grid View)"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#8CC0EB] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Danh sách (List View)"
              >
                <ListIcon size={14} />
              </button>
            </div>

            {viewMode === 'grid' && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#181b24] border border-white/10 rounded-lg">
                <ZoomOut size={12} className="text-slate-400" />
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
                  className="w-20 accent-sky-400 cursor-pointer h-1"
                />
                <ZoomIn size={12} className="text-slate-400" />
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {filteredImages.length} / {images.length} {isEn ? 'items' : 'ảnh'}
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-sky-400" />
            <span className="text-xs font-mono">{isEn ? 'Loading assets...' : 'Đang tải dữ liệu ảnh...'}</span>
          </div>
        ) : !currentFolder ? (
          /* ROOT: FOLDER CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {folders
              .filter((f) => !debouncedSearch || f.toLowerCase().includes(debouncedSearch.toLowerCase()))
              .map((folderName) => (
                <div
                  key={folderName}
                  onClick={() => onSelectFolder?.(folderName)}
                  className="group bg-[#161922] border border-white/[0.08] hover:border-sky-500/50 rounded-xl p-4 cursor-pointer hover:bg-[#1a1e28] transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-400 group-hover:text-slate-950 transition-all">
                      <Folder size={24} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderToDelete(folderName);
                        setDeleteFolderModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-all cursor-pointer"
                      title={isEn ? 'Delete folder' : 'Xóa thư mục'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm truncate mb-0.5 group-hover:text-sky-400 transition-colors">
                      {folderName}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isEn ? 'Click to open' : 'Nhấp để quản lý'}
                    </span>
                  </div>
                </div>
              ))}

            {/* Create Folder Card */}
            <div
              onClick={() => setCreateFolderModalOpen(true)}
              className="bg-[#12141c] border-2 border-dashed border-white/10 hover:border-sky-500/50 hover:bg-sky-500/[0.03] rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-sky-400 min-h-[120px]"
            >
              <FolderPlus size={24} />
              <span className="font-semibold text-xs">{isEn ? 'New Folder' : 'Tạo Thư Mục Mới'}</span>
            </div>
          </div>
        ) : filteredImages.length === 0 ? (
          /* EMPTY STATE */
          <div className="h-64 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-[#161922] border border-white/10 flex items-center justify-center text-slate-600">
              <ImageIcon size={32} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                {isEn ? 'No images found' : 'Thư mục chưa có ảnh'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn ? 'Drag & drop image files here or click Upload.' : 'Kéo thả tệp tin ảnh vào đây hoặc bấm nút Tải Lên.'}
              </p>
            </div>
            {selectedFiles.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer transition-colors"
              >
                {isEn ? 'Select Files Now' : 'Chọn tệp tin ngay'}
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* IMAGE GRID VIEW */
          <div className={`grid ${getGridColsClass(zoomLevel)}`}>
            {filteredImages.map((img) => (
              <div
                key={img.key}
                className="bg-[#161922] border border-white/[0.08] rounded-xl overflow-hidden group hover:border-sky-500/50 hover:shadow-xl transition-all flex flex-col"
              >
                {/* Image Box */}
                <div className="aspect-square bg-[#0b0d13] flex items-center justify-center relative overflow-hidden cursor-pointer"
                  onClick={() => setPreviewImage(img)}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-[#07090e]/85 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => copyUrl(img.url)}
                      className="w-24 py-1 rounded bg-[#8CC0EB] text-[#07090e] font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer hover:bg-[#BFDDF0] transition-colors"
                    >
                      <Copy size={11} />
                      <span>{isEn ? 'Copy' : 'Sao chép'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUpdatingKey(img.key);
                        updateFileInputRef.current?.click();
                      }}
                      className="w-24 py-1 rounded bg-[#1f232e] border border-white/20 text-slate-200 font-semibold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer hover:border-sky-400 hover:text-sky-400 transition-colors"
                    >
                      <Edit3 size={11} />
                      <span>{isEn ? 'Replace' : 'Thay thế'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteImageTarget(img)}
                      className="w-24 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer hover:bg-rose-500/30 transition-colors"
                    >
                      <Trash2 size={11} />
                      <span>{isEn ? 'Delete' : 'Xóa'}</span>
                    </button>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-2 border-t border-white/[0.06] bg-[#141720]">
                  <p className="text-[11px] font-semibold text-slate-200 truncate text-center" title={img.name}>
                    {img.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 text-center">
                    {formatBytes(img.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW TABLE */
          <div className="bg-[#141720] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f121a] border-b border-white/[0.08] text-[10px] uppercase font-mono font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-3">{isEn ? 'Preview' : 'Xem trước'}</th>
                  <th className="px-4 py-3">{isEn ? 'File Name & URL' : 'Tên tệp tin & Đường dẫn'}</th>
                  <th className="px-4 py-3">{isEn ? 'Size' : 'Dung lượng'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredImages.map((img) => (
                  <tr key={img.key} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-2.5">
                      <div
                        onClick={() => setPreviewImage(img)}
                        className="w-9 h-9 rounded-lg bg-[#0b0d13] border border-white/10 p-0.5 cursor-pointer hover:border-sky-400 flex items-center justify-center overflow-hidden"
                      >
                        <img src={img.url} alt="" className="w-full h-full object-contain" />
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 text-xs">{img.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-sm">
                          {img.url}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                      {formatBytes(img.size)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => copyUrl(img.url)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Sao chép link"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUpdatingKey(img.key);
                            updateFileInputRef.current?.click();
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Thay thế ảnh"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteImageTarget(img)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FLOATING UPLOAD BAR */}
      {selectedFiles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-3 animate-fadeIn">
          <div className="bg-[#141720]/95 border border-sky-500/40 shadow-2xl rounded-2xl p-3.5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#8CC0EB] text-[#07090e] font-bold flex items-center justify-center shrink-0">
                  <UploadCloud size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {isEn ? 'Ready to upload' : 'Sẵn sàng tải lên'} ({selectedFiles.length} {isEn ? 'files' : 'ảnh'})
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isEn ? 'Folder:' : 'Thư mục:'} <span className="text-sky-400 font-semibold">{currentFolder}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-3.5 py-1.5 rounded-lg bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#BFDDF0] transition-colors flex items-center gap-1.5"
                >
                  {uploading ? <RefreshCw size={12} className="animate-spin" /> : null}
                  <span>{uploading ? (isEn ? 'Uploading...' : 'Đang tải...') : (isEn ? 'Upload Now' : 'Tải Lên Ngay')}</span>
                </button>
              </div>
            </div>

            {/* Staged file chips */}
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 px-2 py-1 bg-[#1a1e28] border border-white/10 rounded-md text-[10px] font-mono text-slate-300 flex items-center gap-1.5"
                >
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <X
                    size={11}
                    className="cursor-pointer hover:text-rose-400 transition-colors"
                    onClick={() => removeSelectedFile(idx)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#141720] border border-white/10 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FolderPlus size={18} className="text-sky-400" />
              <span>{isEn ? 'Create New Folder' : 'Tạo Thư Mục Mới'}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isEn ? 'Enter folder name (letters, numbers, underscore, hyphen only).' : 'Tên thư mục viết liền không dấu, không chứa khoảng trắng (VD: relics, icons).'}
            </p>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                autoFocus
                placeholder="VD: avatarChampions, relics..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1e28] border border-white/10 text-slate-100 text-xs font-mono focus:outline-none focus:border-sky-500 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateFolderModalOpen(false);
                    setNewFolderName('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider hover:bg-[#BFDDF0] cursor-pointer"
                >
                  {isEn ? 'Create' : 'Tạo Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE FOLDER MODAL */}
      {deleteFolderModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#141720] border border-rose-500/30 p-5 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {isEn ? 'Delete Entire Folder?' : 'Xóa Toàn Bộ Thư Mục?'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {isEn ? 'This will permanently delete folder ' : 'Hành động này sẽ xóa vĩnh viễn thư mục '}
              <strong className="text-rose-400 font-mono">"{folderToDelete}"</strong>
              {isEn ? ' and ALL images inside it from Cloudflare R2.' : ' và TẤT CẢ các ảnh bên trong khỏi Cloudflare R2.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteFolderModalOpen(false);
                  setFolderToDelete('');
                }}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFolder}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-rose-500 cursor-pointer"
              >
                {isEn ? 'Delete Folder' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE IMAGE CONFIRM MODAL */}
      {deleteImageTarget && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#141720] border border-white/10 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {isEn ? 'Delete Image?' : 'Xóa Ảnh Này?'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 truncate font-mono">
              {deleteImageTarget.name}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteImageTarget(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteImage}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-rose-500 cursor-pointer"
              >
                {isEn ? 'Delete' : 'Xóa Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#141720] border border-white/10 rounded-2xl overflow-hidden shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 truncate max-w-md">
                {previewImage.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyUrl(previewImage.url)}
                  className="px-2.5 py-1 rounded bg-[#8CC0EB] text-[#07090e] font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={11} />
                  <span>{isEn ? 'Copy Link' : 'Chép Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#0b0d13] flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>

            <div className="p-3 border-t border-white/[0.08] bg-[#101216] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate max-w-sm">{previewImage.url}</span>
              <span>{formatBytes(previewImage.size)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={updateFileInputRef}
        onChange={handleUpdateChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
}
