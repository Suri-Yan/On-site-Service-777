import React, { useState } from "react";

interface KingcomLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function KingcomLogo({ className = "", iconOnly = false }: KingcomLogoProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`flex items-center gap-3 ${className}`} id="kingcom-logo-container">
      {hasError ? (
        // Fallback robust custom SVG representing Kingcom if image fails to load
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center shrink-0 w-10 h-10 bg-[#155dfc] rounded-xl border border-blue-400/20 shadow-inner">
            <svg
              width="28"
              height="28"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Monitor Screen Frame with Perspective */}
              <path
                d="M15 20 L40 28 L40 72 L15 80 Z"
                fill="#1e3a8a"
                stroke="white"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <path
                d="M15 80 L30 85 L35 85"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <rect x="48" y="32" width="12" height="12" rx="2.5" fill="#f37021" />
              <rect x="46" y="58" width="11" height="11" rx="2" fill="#f37021" />
              <rect x="50" y="46" width="10" height="10" rx="2.2" fill="#ffffff" />
            </svg>
          </div>
          {!iconOnly && (
            <div className="flex flex-col text-left">
              <span className="text-lg font-black tracking-wider text-slate-800 leading-none font-sans">
                KING<span className="text-blue-600">COM</span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 tracking-[0.15em] uppercase leading-none mt-1">
                Computer Shop
              </span>
            </div>
          )}
        </div>
      ) : (
        // Main high fidelity rendering of the actual logo image from Kingcom website inside a theme-cohesive blue brand container
        <div className="flex items-center bg-[#155dfc] px-4 py-2 rounded-xl border border-blue-400/20 shadow-sm transition-all hover:bg-[#114ecc]">
          <img
            src="https://kingcom.co.th/pub/static/frontend/Sm/kingcom/th_TH/images/logo.svg"
            alt="KingCOM"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className={`${iconOnly ? "h-6 object-contain" : "h-7 object-contain"} max-w-[180px]`}
          />
        </div>
      )}
    </div>
  );
}
