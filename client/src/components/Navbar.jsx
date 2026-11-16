import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Smart Sticky & Direction-Aware Autohide Navigation Bar
 * Features:
 * - Brand Logo
 * - 4 Navigation Items: Champions, Relics, Tierlist, Maps
 * - Language Switcher Button (VI | EN) with persistence
 * - Smart Autohide: Hides on scroll-down, smoothly slides back in on subtle scroll-up
 */
export default function Navbar({ onLogoClick, activeTab = 'champions', onSelectTab }) {
  const { language, setLanguage, t } = useLanguage();
  const isEn = language === 'en';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  // Direction-aware scroll detection with requestAnimationFrame
  useEffect(() => {
    let ticking = false;

    const updateNavbar = () => {
      const currentScrollY =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        window.scrollY ||
        0;
      const diff = currentScrollY - lastScrollY.current;

      // 1. At the very top (<= 20px), always visible and transparent
      if (currentScrollY <= 20) {
        setIsVisible(true);
        setIsScrolled(false);
        lastScrollY.current = currentScrollY;
        ticking = false;
        return;
      }

      setIsScrolled(true);

      // 2. Keep pinned when mobile drawer is open
      if (isMobileMenuOpen) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        ticking = false;
        return;
      }

      // 3. Scrolling down (> 60px threshold with > 5px delta): Hide navbar
      if (diff > 5 && currentScrollY > 60) {
        setIsVisible(false);
      }
      // 4. Scrolling up even slightly (diff < -3px): Smoothly reveal navbar
      else if (diff < -3) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateNavbar();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  const navItems = [
    { id: 'home', path: '/', label: t('nav.home') || (isEn ? 'Home' : 'Trang Chủ'), fallback: 'Trang Chủ' },
    { id: 'champions', path: '/champions', label: t('nav.champions'), fallback: 'Champions' },
    { id: 'relics', path: '/relics', label: t('nav.relics'), fallback: 'Relics' },
    { id: 'powers', path: '/powers', label: t('nav.powers'), fallback: 'Powers' },
    { id: 'items', path: '/items', label: t('nav.items'), fallback: 'Items' },
    { id: 'cards', path: '/cards', label: t('nav.cards'), fallback: 'Cards' },
    { id: 'tierlist', path: '/tierlist', label: t('nav.tierlist'), fallback: 'Tier List' },
    { id: 'maps', path: '/maps', label: t('nav.maps'), fallback: 'Maps' }
  ];

  const handleNavClick = (e, item) => {
    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      onSelectTab?.(item.id);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogoClick = (e) => {
    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      onLogoClick?.();
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full px-6 md:px-12 py-4 sm:py-5 flex items-center justify-between transition-transform duration-300 ease-in-out select-none ${
          isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        } ${
          isScrolled
            ? 'bg-[#07090e] shadow-2xl border-b border-white/15'
            : 'bg-[#07090e]/95 border-b border-white/10'
        }`}
      >
      {/* Brand Logo */}
      <a
        href="/"
        onClick={handleLogoClick}
        aria-label="Home"
        className="flex items-center cursor-pointer select-none group py-1"
      >
        <img
          src="/logo.webp"
          alt="Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(140,192,235,0.35)]"
        />
      </a>

      {/* Desktop Navigation Items */}
      <nav className="hidden md:flex items-center gap-3.5 lg:gap-6 xl:gap-8">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <a
              key={item.id}
              href={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={`text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer relative py-1 font-heading ${
                isActive
                  ? 'text-white drop-shadow-[0_0_12px_rgba(140,192,235,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8CC0EB] rounded-full" />
              )}
            </a>
          );
        })}
      </nav>

      {/* Right Controls: Language Switcher & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        {/* Language Switcher Button (Global Icon) */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="p-2 rounded-xl border border-white/15 bg-[#121826] text-slate-300 hover:text-white hover:border-[#8CC0EB]/50 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm group"
          title={language === 'vi' ? 'Ngôn ngữ: Tiếng Việt (Bấm để đổi sang English)' : 'Language: English (Click to switch to Tiếng Việt)'}
          aria-label="Switch Language"
        >
          <svg
            className="w-4 h-4 text-[#8CC0EB] group-hover:scale-110 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#07090e] border-b-2 border-white/20 p-5 flex flex-col gap-3 shadow-2xl">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className="text-left text-sm font-semibold py-2 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
    {/* Layout Spacer to preserve natural document flow */}
    <div className="h-[72px] sm:h-[76px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
  </>
  );
}
