import React, { useState } from 'react';

interface DoeLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

/**
 * Official Emblem of the Department of Employment, Ministry of Labour (กรมการจัดหางาน กระทรวงแรงงาน)
 * Renders the authentic high-resolution official emblem uploaded by the user with SVG fallback.
 */
export const DoeLogo: React.FC<DoeLogoProps> = ({ 
  className = "w-10 h-10", 
  size,
  showText = true 
}) => {
  const [imgError, setImgError] = useState(false);
  const dimensionProps = size ? { width: size, height: size } : {};

  if (!imgError) {
    return (
      <img
        src="/doe_th_logo_RGB.png"
        alt="ตราสัญลักษณ์กรมการจัดหางาน กระทรวงแรงงาน"
        className={`object-contain select-none pointer-events-none ${className}`}
        onError={() => setImgError(true)}
        {...dimensionProps}
      />
    );
  }

  // High-fidelity vector SVG fallback
  return (
    <svg 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...dimensionProps}
      aria-label="ตราสัญลักษณ์กรมการจัดหางาน กระทรวงแรงงาน"
    >
      <defs>
        <radialGradient id="doe-seal-bg" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#1e256b" />
          <stop offset="70%" stopColor="#121748" />
          <stop offset="100%" stopColor="#0b0e33" />
        </radialGradient>
        <linearGradient id="doe-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd85e" />
          <stop offset="50%" stopColor="#d49b18" />
          <stop offset="100%" stopColor="#b37e0e" />
        </linearGradient>
        <path id="doe-text-curve" d="M 60 410 A 210 210 0 0 0 440 410" fill="none" />
      </defs>

      <circle cx="250" cy="205" r="165" fill="url(#doe-seal-bg)" />
      <circle cx="250" cy="205" r="172" stroke="#48695d" strokeWidth="5" fill="none" />
      <circle cx="250" cy="205" r="168" stroke="#ffffff" strokeWidth="2.5" fill="none" />
      <circle cx="250" cy="205" r="165" stroke="#d4145a" strokeWidth="3.5" fill="none" />
      <circle cx="250" cy="205" r="161" stroke="#f6c438" strokeWidth="3" fill="none" />

      {/* Radiating Golden Rays */}
      <g stroke="#e5ad26" strokeWidth="2.5" strokeDasharray="3 7" opacity="0.85">
        <line x1="250" y1="205" x2="250" y2="45" />
        <line x1="250" y1="205" x2="285" y2="48" />
        <line x1="250" y1="205" x2="320" y2="60" />
        <line x1="250" y1="205" x2="350" y2="80" />
        <line x1="250" y1="205" x2="375" y2="108" />
        <line x1="250" y1="205" x2="395" y2="142" />
        <line x1="250" y1="205" x2="405" y2="180" />
        <line x1="250" y1="205" x2="405" y2="220" />
        <line x1="250" y1="205" x2="395" y2="258" />
        <line x1="250" y1="205" x2="375" y2="292" />
        <line x1="250" y1="205" x2="350" y2="320" />
        <line x1="250" y1="205" x2="320" y2="340" />

        <line x1="250" y1="205" x2="215" y2="48" />
        <line x1="250" y1="205" x2="180" y2="60" />
        <line x1="250" y1="205" x2="150" y2="80" />
        <line x1="250" y1="205" x2="125" y2="108" />
        <line x1="250" y1="205" x2="105" y2="142" />
        <line x1="250" y1="205" x2="95" y2="180" />
        <line x1="250" y1="205" x2="95" y2="220" />
        <line x1="250" y1="205" x2="105" y2="258" />
        <line x1="250" y1="205" x2="125" y2="292" />
        <line x1="250" y1="205" x2="150" y2="320" />
        <line x1="250" y1="205" x2="180" y2="340" />
      </g>

      <ellipse cx="250" cy="180" rx="90" ry="85" fill="#f5c23d" opacity="0.15" />

      {/* Stylized White Clouds */}
      <g fill="#ffffff" stroke="#c99b24" strokeWidth="3">
        <path d="M 170 305 C 150 305 135 295 145 280 C 155 265 180 268 190 280 C 200 265 225 265 235 280 C 245 262 275 262 285 280 C 295 265 320 265 330 280 C 345 265 365 275 360 295 C 365 305 350 320 330 320 C 310 325 290 320 270 325 C 245 330 215 330 190 322 C 175 322 165 315 170 305 Z" />
      </g>

      {/* Deities */}
      <g fill="url(#doe-gold-grad)" stroke="#684704" strokeWidth="1.2">
        <path d="M 250 65 Q 262 105 272 135 Q 262 145 250 148 Q 238 145 228 135 Q 238 105 250 65 Z" fill="#ffffff" stroke="#d49b18" strokeWidth="2.5" />
        <ellipse cx="250" cy="148" rx="14" ry="17" fill="#ffffff" stroke="#c9981e" strokeWidth="1.5" />
        <path d="M 235 165 Q 250 162 265 165 L 274 205 Q 250 215 226 205 Z" fill="url(#doe-gold-grad)" stroke="#8b5e09" strokeWidth="1.5" />
        <path d="M 278 130 L 276 215" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        <path d="M 224 205 Q 250 210 276 205 Q 295 240 280 275 Q 250 282 220 275 Q 205 240 224 205 Z" fill="url(#doe-gold-grad)" stroke="#8b5e09" strokeWidth="1.5" />

        <path d="M 185 92 Q 194 125 200 150 Q 190 156 182 156 Q 172 150 174 125 Z" fill="#ffffff" stroke="#d49b18" strokeWidth="2" />
        <ellipse cx="184" cy="158" rx="12" ry="15" fill="#ffffff" stroke="#c9981e" strokeWidth="1.5" />
        <path d="M 172 172 Q 184 170 196 172 L 202 212 Q 184 218 166 212 Z" fill="url(#doe-gold-grad)" stroke="#8b5e09" strokeWidth="1.5" />

        <path d="M 315 92 Q 326 125 328 150 Q 318 156 310 156 Q 300 150 304 125 Z" fill="#ffffff" stroke="#d49b18" strokeWidth="2" />
        <ellipse cx="316" cy="158" rx="12" ry="15" fill="#ffffff" stroke="#c9981e" strokeWidth="1.5" />
        <path d="M 304 172 Q 316 170 328 172 L 334 212 Q 316 218 298 212 Z" fill="url(#doe-gold-grad)" stroke="#8b5e09" strokeWidth="1.5" />
      </g>

      {showText && (
        <text 
          fill="#d99f18" 
          stroke="#ffffff" 
          strokeWidth="3" 
          paintOrder="stroke fill" 
          fontSize="38" 
          fontWeight="900" 
          fontFamily="'Prompt', sans-serif" 
          letterSpacing="3"
        >
          <textPath href="#doe-text-curve" startOffset="50%" textAnchor="middle">
            กรมการจัดหางาน
          </textPath>
        </text>
      )}
    </svg>
  );
};
