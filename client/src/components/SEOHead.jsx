import { useEffect } from 'react';

/**
 * SEOHead Component
 * Manages document head, Open Graph, Twitter Cards, and Schema.org JSON-LD
 * Works seamlessly with React 19 native hoisting and guarantees DOM synchronization
 */
export default function SEOHead({
  title,
  description,
  image = '/assets/hero-bg.jpg',
  url,
  type = 'website',
  jsonLd = null
}) {
  const defaultTitle = 'The Path of Champions Guide - Cẩm Nang Con Đường Anh Hùng LoR';
  const finalTitle = title ? `${title} | PoC Guide` : defaultTitle;
  const finalDesc = description || 'Hệ thống tra cứu chuyên sâu toàn bộ 89 tướng, 155 cổ vật, 1,196 sức mạnh và bảng xếp hạng meta Con Đường Anh Hùng.';
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://thepathofchampions.guide/');

  useEffect(() => {
    // 1. Update Document Title
    document.title = finalTitle;

    // Helper to update or create a meta tag
    const setMeta = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMeta('name', 'title', finalTitle);
    setMeta('name', 'description', finalDesc);

    // 3. Open Graph Tags
    setMeta('property', 'og:title', finalTitle);
    setMeta('property', 'og:description', finalDesc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', currentUrl);
    if (image) {
      const fullImageUrl = image.startsWith('http')
        ? image
        : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`;
      setMeta('property', 'og:image', fullImageUrl);
      setMeta('property', 'twitter:image', fullImageUrl);
    }

    // 4. Twitter Cards
    setMeta('property', 'twitter:title', finalTitle);
    setMeta('property', 'twitter:description', finalDesc);
    setMeta('property', 'twitter:card', 'summary_large_image');

    // 5. Dynamic JSON-LD Structured Data
    if (jsonLd) {
      let scriptTag = document.getElementById('seo-dynamic-jsonld');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'seo-dynamic-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      // Optional cleanup on unmount
      const scriptTag = document.getElementById('seo-dynamic-jsonld');
      if (scriptTag) scriptTag.textContent = '';
    };
  }, [finalTitle, finalDesc, image, currentUrl, type, jsonLd]);

  return (
    <>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      {image && <meta property="og:image" content={image} />}
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDesc} />
      {image && <meta property="twitter:image" content={image} />}
    </>
  );
}
