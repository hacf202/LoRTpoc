import React, { useState, useEffect } from 'react';

/**
 * ScrollFab Component
 * Floating Action Button positioned at the bottom-right corner.
 * - When at the top of the page: displays a Down arrow, clicks to smoothly scroll to the explore section.
 * - When scrolled down: smoothly transforms to an Up arrow, clicks to return to the top of the page.
 */
export default function ScrollFab({ targetId = 'explore' }) {
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Toggle when scrolled past 320px
      setIsScrolledDown(window.scrollY > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    if (isScrolledDown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
      {/* Subtle pulse ring accent when in scroll-down CTA mode */}
      {!isScrolledDown && (
        <span
          className="absolute -inset-1.5 rounded-full border border-[#8CC0EB]/40 animate-ping pointer-events-none opacity-70"
          aria-hidden="true"
        />
      )}

      <button
        onClick={handleClick}
        type="button"
        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0e1422] hover:bg-[#182236] border-2 border-[#8CC0EB] ring-2 ring-[#8CC0EB]/25 ring-offset-2 ring-offset-[#07090e] text-[#8CC0EB] hover:text-[#FFF9D2] shadow-[0_0_22px_rgba(140,192,235,0.35),0_10px_35px_rgba(0,0,0,0.9)] hover:shadow-[0_0_32px_rgba(140,192,235,0.6),0_12px_40px_rgba(0,0,0,0.95)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group select-none ${
          isScrolledDown ? '' : 'animate-gentle-bounce'
        }`}
        aria-label={isScrolledDown ? 'Cuộn về đầu trang' : 'Cuộn xuống khám phá cẩm nang'}
        title={isScrolledDown ? 'Về đầu trang' : 'Cuộn xuống khám phá cẩm nang'}
      >
        <svg
          className={`w-5 h-5 sm:w-6 sm:h-6 transform transition-transform duration-300 ${
            isScrolledDown
              ? 'rotate-180 group-hover:-translate-y-1'
              : 'group-hover:translate-y-1'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.6}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </div>
  );
}
