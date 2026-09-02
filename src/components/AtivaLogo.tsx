import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const AtivaLogo: React.FC<Props> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const sizeMap = {
    sm: { symbol: 24, text: 'text-sm', sub: 'text-[8px]' },
    md: { symbol: 32, text: 'text-base', sub: 'text-[9px]' },
    lg: { symbol: 44, text: 'text-xl', sub: 'text-[10px]' },
    xl: { symbol: 56, text: 'text-2xl', sub: 'text-xs' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Grupo Ativa Geometric Symbol */}
      <svg
        width={currentSize.symbol}
        height={currentSize.symbol}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Top Dark Arch */}
        <path
          d="M 12 40 C 35 15, 65 15, 88 40 C 70 28, 30 28, 12 40 Z"
          fill="#111827"
        />
        {/* Upper Teal Arch */}
        <path
          d="M 8 46 C 35 22, 65 22, 92 46 C 70 34, 30 34, 8 46 Z"
          fill="#007A78"
        />
        {/* Lower Teal Arch */}
        <path
          d="M 12 56 C 35 78, 65 78, 88 56 C 70 66, 30 66, 12 56 Z"
          fill="#007A78"
        />
        {/* Central Pupil Circle with stylized A */}
        <circle cx="50" cy="50" r="15" fill="#111827" />
        <path
          d="M 43 59 L 50 41 L 57 59 M 45 54 L 55 54"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Typographic Brandmark */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-black tracking-wider text-[#007A78] ${currentSize.text}`}
          style={{ letterSpacing: '0.12em' }}
        >
          ATIVA
        </span>
        {showSubtitle && (
          <span
            className={`font-bold tracking-widest text-slate-500 uppercase ${currentSize.sub}`}
            style={{ letterSpacing: '0.22em' }}
          >
            GRUPO ATIVA
          </span>
        )}
      </div>
    </div>
  );
};
