import { useEffect } from 'react';
import { getGlobalKeywords } from '../utils/seoKeywords';

/**
 * SEOHead Component
 * Manages document head, Open Graph, Twitter Cards, canonical links, and Schema.org JSON-LD
 * Guarantees synchronization with React 19 and SPA navigation
 */
export default function SEOHead({
  title,
  description,
  keywords,
  image = '/og-image.webp',
  url,
  type = 'website',
  jsonLd = null,
  lang = 'vi',
  robots = 'index, follow'
}) {
  const isEn = lang === 'en';
  const defaultTitle = isEn
    ? 'LoR TPoC - LoR TPoC - lortpoc.com | lortpoc.com'
    : 'LoR TPoC - Cẩm Nang Con Đường Anh Hùng & Bảng Xếp Hạng | lortpoc.com';

  let finalTitle = title || defaultTitle;
  if (!finalTitle.includes('PoC Guide') && !finalTitle.includes('POC GUIDE')) {
    finalTitle = `${finalTitle} | lortpoc.com`;
  }

  const finalDesc =
    description ||
    (isEn
      ? 'Comprehensive database and strategy guide for Legends of Runeterra: The Path of Champions. Complete 89 champions, relics, powers, star powers, and meta tier list.'
      : 'Hệ thống tra cứu chuyên sâu toàn bộ 89 tướng, 155 cổ vật, 1,196 sức mạnh và bảng xếp hạng meta Con Đường Anh Hùng.');

  const finalKeywords = keywords || getGlobalKeywords(lang);

  const currentUrl =
    url ||
    (typeof window !== 'undefined'
      ? window.location.href.split('#')[0]
      : 'https://lortpoc.com/');

  useEffect(() => {
    // 1. Update Document Title & Language
    document.title = finalTitle;
    document.documentElement.lang = isEn ? 'en' : 'vi';

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

    // Helper to update or create a link tag
    const setLink = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Primary Meta Tags
    setMeta('name', 'title', finalTitle);
    setMeta('name', 'description', finalDesc);
    setMeta('name', 'keywords', finalKeywords);
    setMeta('name', 'author', 'LoR TPoC Community (lortpoc.com)');
    setMeta('name', 'robots', robots || 'index, follow');

    // 3. Canonical URL
    setLink('canonical', currentUrl);

    // 4. Open Graph Tags
    setMeta('property', 'og:title', finalTitle);
    setMeta('property', 'og:description', finalDesc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:site_name', 'LoR TPoC - lortpoc.com');
    setMeta('property', 'og:locale', isEn ? 'en_US' : 'vi_VN');
    setMeta('property', 'og:locale:alternate', isEn ? 'vi_VN' : 'en_US');

    if (image) {
      const fullImageUrl = image.startsWith('http')
        ? image
        : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`;
      setMeta('property', 'og:image', fullImageUrl);
      setMeta('property', 'twitter:image', fullImageUrl);
    }

    // 5. Twitter Cards
    setMeta('property', 'twitter:title', finalTitle);
    setMeta('property', 'twitter:description', finalDesc);
    setMeta('property', 'twitter:card', 'summary_large_image');
    setMeta('property', 'twitter:url', currentUrl);

    // 6. Dynamic JSON-LD Structured Data
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
      const scriptTag = document.getElementById('seo-dynamic-jsonld');
      if (scriptTag) scriptTag.textContent = '';
    };
  }, [finalTitle, finalDesc, finalKeywords, image, currentUrl, type, jsonLd, isEn]);

  return (
    <>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <meta name="keywords" content={finalKeywords} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      {image && <meta property="og:image" content={image} />}
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDesc} />
      {image && <meta property="twitter:image" content={image} />}
      <link rel="canonical" href={currentUrl} />
    </>
  );
}
