import React from 'react';

/**
 * Reusable Hero Background Layer
 * Renders high-res art with a multi-stop vignette gradient
 * fading to solid dark from bottom up to the lower half.
 */
export default function BackgroundHero({
  imageUrl = 'https://dd.b.pvp.net/latest/set5/en_us/img/cards/05SH014T2-full.png',
  alt = 'Background Splash Art',
  isSubpage = false
}) {
  return (
    <div className="absolute inset-0 w-full h-screen z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Background Image: Hạ thấp tâm điểm trên mobile để đỉnh tháp không bị thanh điều hướng che khuất */}
      <div
        className={`w-full h-full bg-cover bg-no-repeat bg-[center_15%] contrast-[1.08] transition-all duration-500 scale-115 sm:scale-100 translate-y-14 sm:translate-y-0 ${
          isSubpage ? 'opacity-35 brightness-[0.7]' : 'opacity-100 brightness-[0.92]'
        }`}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      {/* Multi-stop Gradient Vignette: Darkens from bottom up */}
      <div 
        className="absolute inset-0"
        style={{
          background: isSubpage
            ? `
              linear-gradient(
                to top,
                #07090e 0%,
                #07090e 55%,
                rgba(7, 9, 14, 0.95) 70%,
                rgba(7, 9, 14, 0.75) 80%,
                rgba(7, 9, 14, 0.35) 90%,
                transparent 100%
              ),
              radial-gradient(
                ellipse at 50% 25%,
                transparent 25%,
                rgba(7, 9, 14, 0.6) 65%,
                #07090e 100%
              )
            `
            : `
              linear-gradient(
                to top,
                #07090e 0%,
                #07090e 12%,
                rgba(7, 9, 14, 0.85) 24%,
                rgba(7, 9, 14, 0.45) 36%,
                rgba(7, 9, 14, 0.15) 45%,
                transparent 55%
              ),
              radial-gradient(
                ellipse at 50% 40%,
                transparent 45%,
                rgba(7, 9, 14, 0.35) 80%,
                #07090e 100%
              )
            `
        }}
      />
    </div>
  );
}
