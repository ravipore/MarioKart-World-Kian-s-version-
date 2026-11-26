import React from 'react';
import { ItemType } from '../game/types';

interface ItemIconProps {
  type: ItemType;
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ type, className = 'w-11 h-11' }) => {
  switch (type) {
    case 'bullet_bill':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path d="M12 20H38C49 20 56 26 56 32C56 38 49 44 38 44H12V20Z" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
          <path d="M12 20H18V44H12C9 44 8 40 8 32C8 24 9 20 12 20Z" fill="#ef4444" />
          <ellipse cx="42" cy="29" rx="4.5" ry="5.5" fill="#ffffff" />
          <circle cx="43.5" cy="29.5" r="2.2" fill="#0f172a" />
          <path d="M36 24L46 27" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M25 36H34C36 36 37 39 34 40H25V36Z" fill="#f8fafc" />
          <path d="M6 26L2 22M6 32H1M6 38L2 42" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'spiny_shell':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          {/* Spikes */}
          <path d="M32 7L37 19H27L32 7Z" fill="#f8fafc" />
          <path d="M16 14L25 22L18 28L16 14Z" fill="#f8fafc" />
          <path d="M48 14L46 28L39 22L48 14Z" fill="#f8fafc" />
          {/* Blue Shell Dome */}
          <path d="M14 40C14 25 22 18 32 18C42 18 50 25 50 40H14Z" fill="#2563eb" stroke="#93c5fd" strokeWidth="2" />
          {/* Wings */}
          <path d="M14 34L4 27L8 37L14 38Z" fill="#ffffff" />
          <path d="M50 34L60 27L56 37L50 38Z" fill="#ffffff" />
          {/* Rim */}
          <rect x="11" y="38" width="42" height="7" rx="3.5" fill="#f8fafc" />
          <rect x="16" y="45" width="32" height="6" rx="3" fill="#0f172a" />
        </svg>
      );

    case 'invincible_star':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path
            d="M32 7L39.5 22.5L56.5 25L44.2 37L47.2 54L32 45.8L16.8 54L19.8 37L7.5 25L24.5 22.5L32 7Z"
            fill="#facc15"
            stroke="#fef9c3"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="25.5" y="25" width="3.5" height="9" rx="1.75" fill="#0f172a" />
          <rect x="35" y="25" width="3.5" height="9" rx="1.75" fill="#0f172a" />
          <path d="M12 14L15 17M52 14L49 17M54 44L50 42" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'nitro_mushroom':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          {/* Mushroom Cap */}
          <path d="M10 35C10 19 20 11 32 11C44 11 54 19 54 35H10Z" fill="#f97316" stroke="#fed7aa" strokeWidth="2" />
          <circle cx="22" cy="24" r="5" fill="#ffffff" />
          <circle cx="42" cy="24" r="5" fill="#ffffff" />
          <circle cx="32" cy="17" r="4" fill="#ffffff" />
          {/* Stem */}
          <path d="M22 35H42V47C42 50 38 52 32 52C26 52 22 50 22 47V35Z" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
          <rect x="27" y="39" width="2.8" height="6" rx="1.4" fill="#0f172a" />
          <rect x="34.2" y="39" width="2.8" height="6" rx="1.4" fill="#0f172a" />
          {/* Nitro Bolt */}
          <path d="M51 40L45 48H50L47 56L56 46H51L51 40Z" fill="#22d3ee" />
        </svg>
      );

    case 'green_shell':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path d="M12 41C12 24 21 16 32 16C43 16 52 24 52 41H12Z" fill="#16a34a" stroke="#86efac" strokeWidth="2.5" />
          <path d="M23 28L32 22L41 28L38 37H26L23 28Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
          <rect x="10" y="39" width="44" height="7" rx="3.5" fill="#f8fafc" />
          <rect x="16" y="46" width="32" height="6" rx="3" fill="#fef3c7" />
        </svg>
      );

    case 'banana_peel':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path d="M29 12H35L36 22C36 22 48 34 54 46C46 50 38 44 34 38C30 46 22 50 10 46C16 34 28 22 28 22L29 12Z" fill="#facc15" stroke="#fde047" strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 28C32 38 32 48 27 52C32 54 38 54 41 50C37 44 34 35 32 28Z" fill="#eab308" />
          <rect x="28" y="9" width="8" height="5" rx="2" fill="#713f12" />
        </svg>
      );

    case 'lightning_bolt':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
          <path
            d="M38 6L14 35H30L24 58L50 28H34L38 6Z"
            fill="#facc15"
            stroke="#c084fc"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};
