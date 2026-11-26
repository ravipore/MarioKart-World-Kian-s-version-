import React from 'react';
import { CharacterId, getCharacterSpec } from '../game/types';

const BINGBONG_AVATAR_URL = '/assets/aistudio/BingBongMan_dinosaur_character__2__2635935f.png';

interface CharacterAvatarProps {
  characterId: CharacterId;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  className = 'h-16 w-16',
}) => {
  const spec = getCharacterSpec(characterId);

  if (characterId === 'bingbong') {
    return (
      <img
        src={BINGBONG_AVATAR_URL}
        alt={`${spec.name} ${spec.species}`}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-label={`${spec.name} ${spec.species}`}
    >
      <rect width="64" height="64" fill="#0f172a" />
      <circle cx="32" cy="34" r="24" fill={spec.hexPrimary} fillOpacity="0.22" />

      {characterId === 'waluigi' && (
        <>
          {/* Purple Suit Shoulders & Dark Overalls */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#7e22ce" />
          <rect x="20" y="45" width="24" height="19" rx="2" fill="#1e1b4b" />
          <circle cx="24" cy="52" r="2.2" fill="#facc15" />
          <circle cx="40" cy="52" r="2.2" fill="#facc15" />
          {/* Human Head + Pointed Ears */}
          <polygon points="15,31 10,27 17,37" fill="#f4cfb4" />
          <polygon points="49,31 54,27 47,37" fill="#f4cfb4" />
          <ellipse cx="32" cy="31" rx="14" ry="15" fill="#f4cfb4" />
          {/* Tall Purple Cap & Brim */}
          <path d="M16 25C16 12 24 7 32 7C40 7 48 12 48 25H16Z" fill="#7e22ce" />
          <ellipse cx="32" cy="25" rx="18" ry="3.5" fill="#6b21a8" />
          {/* Yellow Badge with Inverted L */}
          <circle cx="32" cy="16" r="6" fill="#facc15" />
          <path d="M29.5 19.5V12.5H35V14.5H31.8V19.5H29.5Z" fill="#1e1b4b" />
          {/* Mischievous Eyes & Brows */}
          <ellipse cx="26.5" cy="30" rx="3" ry="3.6" fill="#ffffff" />
          <ellipse cx="37.5" cy="30" rx="3" ry="3.6" fill="#ffffff" />
          <circle cx="27" cy="30.2" r="1.6" fill="#0f172a" />
          <circle cx="37" cy="30.2" r="1.6" fill="#0f172a" />
          <path d="M22 25.5L29 27.5M42 25.5L35 27.5" stroke="#261710" strokeWidth="2" strokeLinecap="round" />
          {/* Crooked Mustache & Pink Nose */}
          <path d="M15 34L22 39L29 36L32 37.5L35 36L42 39L49 34L43 41.5L35 39L32 40L29 39L21 41.5Z" fill="#261710" />
          <ellipse cx="32" cy="34.5" rx="4.2" ry="3.4" fill="#e8798a" />
        </>
      )}

      {characterId === 'mario' && (
        <>
          {/* Red Shirt & Blue Overalls */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#ef4444" />
          <rect x="20" y="45" width="24" height="19" rx="2" fill="#1d4ed8" />
          <circle cx="24" cy="52" r="2.2" fill="#facc15" />
          <circle cx="40" cy="52" r="2.2" fill="#facc15" />
          {/* Ears & Round Head */}
          <circle cx="17" cy="33" r="4" fill="#f4cfb4" />
          <circle cx="47" cy="33" r="4" fill="#f4cfb4" />
          <circle cx="32" cy="32" r="13.5" fill="#f4cfb4" />
          {/* Red Cap & White M Badge */}
          <path d="M17 26C17 14 24 9 32 9C40 9 47 14 47 26H17Z" fill="#ef4444" />
          <ellipse cx="32" cy="26" rx="17" ry="3.5" fill="#dc2626" />
          <circle cx="32" cy="17" r="6" fill="#f8fafc" />
          <path d="M28 20V14H30L32 17L34 14H36V20H34.2V16.8L32 19.6L29.8 16.8V20H28Z" fill="#dc2626" />
          {/* Blue Eyes */}
          <ellipse cx="26.5" cy="30" rx="2.6" ry="3.4" fill="#ffffff" />
          <ellipse cx="37.5" cy="30" rx="2.6" ry="3.4" fill="#ffffff" />
          <circle cx="27" cy="30.2" r="1.6" fill="#0284c7" />
          <circle cx="37" cy="30.2" r="1.6" fill="#0284c7" />
          {/* Bushy Mustache & Round Nose */}
          <path d="M19 36C21 41 26 42 32 39C38 42 43 41 45 36C41 37 36 35 32 36C28 35 23 37 19 36Z" fill="#3b2113" />
          <ellipse cx="32" cy="34.5" rx="4.2" ry="3.4" fill="#f1b596" />
        </>
      )}

      {characterId === 'luigi' && (
        <>
          {/* Green Shirt & Blue Overalls */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#16a34a" />
          <rect x="20" y="45" width="24" height="19" rx="2" fill="#1d4ed8" />
          <circle cx="24" cy="52" r="2.2" fill="#facc15" />
          <circle cx="40" cy="52" r="2.2" fill="#facc15" />
          {/* Ears & Slimmer Head */}
          <circle cx="18" cy="32" r="3.8" fill="#f4cfb4" />
          <circle cx="46" cy="32" r="3.8" fill="#f4cfb4" />
          <ellipse cx="32" cy="31.5" rx="12.5" ry="14" fill="#f4cfb4" />
          {/* Tall Green Cap & White L Badge */}
          <path d="M17 25C17 12 24 7 32 7C40 7 47 12 47 25H17Z" fill="#16a34a" />
          <ellipse cx="32" cy="25" rx="17" ry="3.5" fill="#15803d" />
          <circle cx="32" cy="16" r="6" fill="#f8fafc" />
          <path d="M29.5 12.5H31.8V17.6H35V19.5H29.5V12.5Z" fill="#15803d" />
          {/* Blue Eyes */}
          <ellipse cx="26.8" cy="29.8" rx="2.6" ry="3.4" fill="#ffffff" />
          <ellipse cx="37.2" cy="29.8" rx="2.6" ry="3.4" fill="#ffffff" />
          <circle cx="27" cy="30" r="1.6" fill="#0284c7" />
          <circle cx="37" cy="30" r="1.6" fill="#0284c7" />
          {/* Curved Mustache & Nose */}
          <path d="M19 36.5Q25 42 32 38Q39 42 45 36.5Q39 35 32 36Q25 35 19 36.5Z" fill="#3b2113" />
          <ellipse cx="32" cy="34.2" rx="3.8" ry="3.5" fill="#f1b596" />
        </>
      )}

      {characterId === 'wario' && (
        <>
          {/* Yellow Sleeves & Purple Overalls */}
          <path d="M10 64V50C10 45 19 42 32 42C45 42 54 45 54 50V64H10Z" fill="#eab308" />
          <rect x="19" y="45" width="26" height="19" rx="2" fill="#6b21a8" />
          <circle cx="23.5" cy="52" r="2.4" fill="#facc15" />
          <circle cx="40.5" cy="52" r="2.4" fill="#facc15" />
          {/* Broad Head */}
          <ellipse cx="32" cy="32" rx="15" ry="13.5" fill="#f4cfb4" />
          {/* Yellow Cap & White W Badge */}
          <path d="M16 26C16 14 23 9 32 9C41 9 48 14 48 26H16Z" fill="#eab308" />
          <ellipse cx="32" cy="26" rx="18" ry="3.5" fill="#ca8a04" />
          <circle cx="32" cy="17" r="6" fill="#f8fafc" />
          <path d="M27.5 14H29.5L30.8 18L32 15L33.2 18L34.5 14H36.5L34.4 20H32.6L32 18L31.4 20H29.6L27.5 14Z" fill="#1d4ed8" />
          {/* Eyes & Brow */}
          <ellipse cx="26" cy="29.5" rx="2.8" ry="3.2" fill="#ffffff" />
          <ellipse cx="38" cy="29.5" rx="2.8" ry="3.2" fill="#ffffff" />
          <circle cx="26.5" cy="29.8" r="1.6" fill="#0f172a" />
          <circle cx="37.5" cy="29.8" r="1.6" fill="#0f172a" />
          {/* Zigzag Mustache, Grin & Big Pink Nose */}
          <path d="M14 33L21 39L28 36L32 37.5L36 36L43 39L50 33L44 41.5L36 39L32 40L28 39L20 41.5Z" fill="#1c1917" />
          <ellipse cx="32" cy="34.5" rx="5.2" ry="3.8" fill="#e8798a" />
        </>
      )}

      {characterId === 'black_panther' && (
        <>
          {/* Matte Vibranium Suit & Silver Fang Necklace */}
          <path d="M12 64V50C12 44 20 42 32 42C44 42 52 44 52 50V64H12Z" fill="#111827" />
          <path d="M21 44Q32 51 43 44" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="26,47 28,53 30,48" fill="#e2e8f0" />
          <polygon points="31,48 32,54 33,48" fill="#e2e8f0" />
          <polygon points="34,48 36,53 38,47" fill="#e2e8f0" />
          {/* Pointed Panther Ears & Cowl */}
          <polygon points="18,22 20,8 27,18" fill="#111827" stroke="#8b5cf6" strokeWidth="1" />
          <polygon points="46,22 44,8 37,18" fill="#111827" stroke="#8b5cf6" strokeWidth="1" />
          <ellipse cx="32" cy="30" rx="14" ry="15" fill="#111827" stroke="#334155" strokeWidth="1.2" />
          {/* Silver Cowl Geometry & Glowing White Eyes */}
          <path d="M21 24L32 28L43 24" fill="none" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M32 20V35" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          <polygon points="21,28 29,30 27,32 22,31" fill="#f8fafc" />
          <polygon points="43,28 35,30 37,32 42,31" fill="#f8fafc" />
        </>
      )}

      {characterId === 'iron_man' && (
        <>
          {/* Crimson Armor Shoulders & Glowing Arc Reactor */}
          <path d="M12 64V50C12 44 20 42 32 42C44 42 52 44 52 50V64H12Z" fill="#dc2626" />
          <path d="M16 48L24 44M48 48L40 44" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="53" r="5" fill="#facc15" />
          <circle cx="32" cy="53" r="3.4" fill="#67e8f9" />
          {/* Red Helmet & Gold Faceplate */}
          <rect x="18" y="13" width="28" height="31" rx="12" fill="#dc2626" />
          <path d="M22 18H42L43 34L37 42H27L21 34L22 18Z" fill="#facc15" />
          <rect x="28" y="13" width="8" height="7" fill="#dc2626" />
          {/* Glowing Cyan Visor Eyes & Slit Mouth */}
          <polygon points="22,27 30,28.5 29,31 23,30" fill="#67e8f9" />
          <polygon points="42,27 34,28.5 35,31 41,30" fill="#67e8f9" />
          <rect x="27" y="36.5" width="10" height="2" rx="1" fill="#7f1d1d" />
        </>
      )}

      {characterId === 'bung' && (
        <>
          {/* Cyan & Orange Racing Jacket */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#06b6d4" />
          <rect x="28" y="42" width="8" height="22" fill="#f97316" />
          {/* Spiky Hair & Face */}
          <polygon points="18,22 22,8 27,18 32,7 37,18 42,8 46,22" fill="#7c2d12" />
          <circle cx="32" cy="31" r="13.5" fill="#f2c7a5" />
          {/* Orange Headband & Big Turbo Goggles */}
          <rect x="18" y="19" width="28" height="5" rx="2" fill="#f97316" />
          <circle cx="25.5" cy="21.5" r="5.2" fill="#fef08a" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="38.5" cy="21.5" r="5.2" fill="#fef08a" stroke="#0f172a" strokeWidth="1.8" />
          {/* Crooked Brows & Goofy Cross-Eyed Funny Face */}
          <path d="M21 26L28 24.5M36 25L43 27.5" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="26.5" cy="30.5" r="3.6" fill="#ffffff" stroke="#0f172a" strokeWidth="0.9" />
          <ellipse cx="37.5" cy="31" rx="3.4" ry="2.4" fill="#ffffff" stroke="#0f172a" strokeWidth="0.9" />
          <circle cx="28" cy="29.8" r="1.5" fill="#0f172a" />
          <circle cx="36" cy="31.5" r="1.5" fill="#0f172a" />
          {/* Open Funny Grin + Cheeky Tongue + Two Big Teeth Sticking Out */}
          <path d="M23 36.5Q32 34.5 41 37Q40 43.5 32 43.5Q24 43.5 23 36.5Z" fill="#450a0a" />
          <ellipse cx="36.5" cy="41.8" rx="3.2" ry="2" fill="#f472b6" />
          <rect x="27.2" y="36" width="4" height="5.2" rx="1" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
          <rect x="32.4" y="36" width="4" height="5.2" rx="1" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
        </>
      )}

      {characterId === 'yoshi' && (
        <>
          {/* Green Dinosaur Body & Red Shell Rim */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#22c55e" />
          <ellipse cx="32" cy="56" rx="9" ry="8" fill="#fef9c3" />
          <path d="M12 46Q17 38 23 45" fill="#ef4444" stroke="#f8fafc" strokeWidth="2" />
          {/* Red Spiky Crest & Green Head */}
          <polygon points="15,24 10,20 18,18 14,13 22,14" fill="#ef4444" />
          <circle cx="29" cy="28" r="12" fill="#22c55e" />
          {/* Big Bulbous Yoshi Snout */}
          <ellipse cx="39" cy="31" rx="12" ry="9.5" fill="#22c55e" />
          <circle cx="43" cy="27.5" r="1.2" fill="#14532d" />
          {/* Tall Oval Eyes */}
          <ellipse cx="26" cy="20" rx="4" ry="5.8" fill="#ffffff" stroke="#15803d" strokeWidth="1" />
          <ellipse cx="33" cy="20" rx="4" ry="5.8" fill="#ffffff" stroke="#15803d" strokeWidth="1" />
          <circle cx="27" cy="20.5" r="2" fill="#0f172a" />
          <circle cx="34" cy="20.5" r="2" fill="#0f172a" />
          <path d="M29 36Q36 40 44 36" fill="none" stroke="#14532d" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {characterId === 'toad' && (
        <>
          {/* Royal Blue Vest with Gold Trim */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#fef9c3" />
          <path d="M12 64V50C12 45 19 42 27 42V64H12ZM37 64V42C45 42 52 45 52 50V64H37Z" fill="#2563eb" />
          <line x1="27" y1="42" x2="27" y2="64" stroke="#facc15" strokeWidth="2" />
          <line x1="37" y1="42" x2="37" y2="64" stroke="#facc15" strokeWidth="2" />
          {/* Cute Face */}
          <circle cx="32" cy="36" r="11.5" fill="#f4cfb4" />
          <ellipse cx="27.5" cy="35" rx="2" ry="3.4" fill="#0f172a" />
          <ellipse cx="36.5" cy="35" rx="2" ry="3.4" fill="#0f172a" />
          <path d="M28 41Q32 44.5 36 41" fill="none" stroke="#9a3412" strokeWidth="1.8" strokeLinecap="round" />
          {/* Giant White Mushroom Cap with Red Spots */}
          <ellipse cx="32" cy="21" rx="20" ry="15" fill="#f8fafc" />
          <circle cx="32" cy="18" r="5.5" fill="#ef4444" />
          <circle cx="17.5" cy="23" r="4.4" fill="#ef4444" />
          <circle cx="46.5" cy="23" r="4.4" fill="#ef4444" />
        </>
      )}

      {characterId === 'toadette' && (
        <>
          {/* Pink & Gold Vest */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#fef9c3" />
          <path d="M12 64V50C12 45 19 42 27 42V64H12ZM37 64V42C45 42 52 45 52 50V64H37Z" fill="#ec4899" />
          <line x1="27" y1="42" x2="27" y2="64" stroke="#facc15" strokeWidth="2" />
          <line x1="37" y1="42" x2="37" y2="64" stroke="#facc15" strokeWidth="2" />
          {/* Twin Pink Braided Pigtails */}
          <circle cx="13" cy="34" r="5" fill="#f472b6" />
          <circle cx="12" cy="41" r="4" fill="#f472b6" />
          <circle cx="51" cy="34" r="5" fill="#f472b6" />
          <circle cx="52" cy="41" r="4" fill="#f472b6" />
          {/* Cute Face */}
          <circle cx="32" cy="36" r="11.5" fill="#f4cfb4" />
          <ellipse cx="27.5" cy="35" rx="2" ry="3.4" fill="#0f172a" />
          <ellipse cx="36.5" cy="35" rx="2" ry="3.4" fill="#0f172a" />
          <path d="M28 41Q32 44.5 36 41" fill="none" stroke="#9a3412" strokeWidth="1.8" strokeLinecap="round" />
          {/* Pink Mushroom Cap with Cream Spots */}
          <ellipse cx="32" cy="21" rx="20" ry="15" fill="#f472b6" />
          <circle cx="32" cy="18" r="5.5" fill="#fef9c3" />
          <circle cx="17.5" cy="23" r="4.4" fill="#fef9c3" />
          <circle cx="46.5" cy="23" r="4.4" fill="#fef9c3" />
        </>
      )}

      {characterId === 'goomba' && (
        <>
          {/* Tan Stem Body */}
          <path d="M20 64L23 42H41L44 64H20Z" fill="#fde68a" />
          <ellipse cx="21" cy="59" rx="6" ry="4" fill="#451a03" />
          <ellipse cx="43" cy="59" rx="6" ry="4" fill="#451a03" />
          {/* Wide Chestnut Mushroom Head */}
          <path d="M12 36C12 18 21 12 32 12C43 12 52 18 52 36C52 44 43 47 32 47C21 47 12 44 12 36Z" fill="#92400e" />
          <ellipse cx="32" cy="40" rx="14" ry="7" fill="#fde68a" />
          {/* Furrowed Angry Eyebrows & Big Eyes */}
          <ellipse cx="26" cy="29" rx="3.8" ry="5" fill="#ffffff" />
          <ellipse cx="38" cy="29" rx="3.8" ry="5" fill="#ffffff" />
          <circle cx="26.5" cy="29.5" r="2" fill="#0f172a" />
          <circle cx="37.5" cy="29.5" r="2" fill="#0f172a" />
          <path d="M19 22L30 26.5M45 22L34 26.5" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
          {/* Scowl & Upward White Fangs */}
          <path d="M23 41H41" stroke="#1c1917" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="24,41 26,35 28,41" fill="#ffffff" />
          <polygon points="36,41 38,35 40,41" fill="#ffffff" />
        </>
      )}

      {characterId === 'peepa' && (
        <>
          {/* Floating White Ghost Body & Wavy Skirt */}
          <path
            d="M14 36C14 20 22 12 32 12C42 12 50 20 50 36V52L44 47L38 53L32 47L26 53L20 47L14 52V36Z"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Stubby Ghost Arms */}
          <ellipse cx="14" cy="37" rx="5" ry="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
          <ellipse cx="50" cy="37" rx="5" ry="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
          {/* Cute Dark Eyes, Rosy Cheeks & Wavy Smile */}
          <ellipse cx="26" cy="30" rx="2.6" ry="3.6" fill="#0f172a" />
          <ellipse cx="38" cy="30" rx="2.6" ry="3.6" fill="#0f172a" />
          <ellipse cx="21" cy="35" rx="3" ry="1.8" fill="#f472b6" />
          <ellipse cx="43" cy="35" rx="3" ry="1.8" fill="#f472b6" />
          <path d="M27 37Q32 41 37 37" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {characterId === 'king_boo' && (
        <>
          {/* Large Round White Ghost Body */}
          <circle cx="32" cy="39" r="20" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Golden Crown with Crimson Ruby */}
          <polygon points="21,22 23,11 28,16 32,8 36,16 41,11 43,22" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
          <polygon points="32,14 34.5,17.5 32,21 29.5,17.5" fill="#dc2626" />
          {/* Fierce Ringed Eyes & Furrowed Brows */}
          <ellipse cx="25" cy="32" rx="4.2" ry="5" fill="#0f172a" />
          <ellipse cx="39" cy="32" rx="4.2" ry="5" fill="#0f172a" />
          <circle cx="25" cy="32" r="2" fill="#f8fafc" />
          <circle cx="39" cy="32" r="2" fill="#f8fafc" />
          <path d="M20 26L29 29M44 26L35 29" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
          {/* Wide Laughing Mouth, Fangs & Pink Tongue */}
          <ellipse cx="32" cy="45" rx="11" ry="6.5" fill="#1e1b4b" />
          <polygon points="24,41 26,46 28,41" fill="#ffffff" />
          <polygon points="36,41 38,46 40,41" fill="#ffffff" />
          <path d="M28 47C28 53 31 56 32 56C33 56 36 53 36 47Z" fill="#f43f5e" />
        </>
      )}

      {characterId === 'shy_guy' && (
        <>
          {/* Crimson Hooded Robe & Belt */}
          <path d="M12 64V50C12 44 20 42 32 42C44 42 52 44 52 50V64H12Z" fill="#dc2626" />
          <rect x="14" y="54" width="36" height="5" fill="#451a03" />
          <rect x="28" y="53" width="8" height="7" rx="1" fill="#facc15" />
          {/* Crimson Hood */}
          <circle cx="32" cy="29" r="18" fill="#dc2626" />
          {/* Oval White Mask + Two Dark Eyeholes + Mouth Hole */}
          <ellipse cx="32" cy="30" rx="12" ry="13.5" fill="#f8fafc" />
          <ellipse cx="27" cy="28" rx="2.8" ry="4" fill="#0f172a" />
          <ellipse cx="37" cy="28" rx="2.8" ry="4" fill="#0f172a" />
          <circle cx="32" cy="37" r="2.3" fill="#0f172a" />
        </>
      )}

      {characterId === 'conkdor' && (
        <>
          {/* Slate Navy Body & Fluffy White Collar Ruff */}
          <path d="M14 64V52C14 47 22 45 32 45C42 45 50 47 50 52V64H14Z" fill="#1e293b" />
          <circle cx="23" cy="46" r="5" fill="#f8fafc" />
          <circle cx="32" cy="45" r="5.5" fill="#f8fafc" />
          <circle cx="41" cy="46" r="5" fill="#f8fafc" />
          {/* Long Neck & Feathered Head */}
          <rect x="25" y="25" width="14" height="21" fill="#1e293b" />
          <polygon points="24,15 20,8 28,12 31,7 34,14" fill="#1e293b" />
          <circle cx="30" cy="21" r="10.5" fill="#1e293b" />
          {/* Fierce Eye & Big Hooked Orange Beak */}
          <circle cx="29" cy="19" r="3.6" fill="#ffffff" />
          <circle cx="30" cy="19" r="1.8" fill="#0f172a" />
          <path d="M34 17L54 22L49 29L33 25Z" fill="#f97316" />
          <polygon points="49,25 54,22 51,31" fill="#ea580c" />
        </>
      )}

      {characterId === 'bowser' && (
        <>
          {/* Spiked Black Collar & Golden Koopa Chest */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#facc15" />
          <rect x="19" y="42" width="26" height="6" rx="2" fill="#111827" />
          <polygon points="24,42 26,38 28,42" fill="#f8fafc" />
          <polygon points="36,42 38,38 40,42" fill="#f8fafc" />
          {/* Twin Curved Horns & Fiery Red Crest */}
          <polygon points="16,22 10,10 21,17" fill="#f8fafc" />
          <polygon points="48,22 54,10 43,17" fill="#f8fafc" />
          <polygon points="26,16 32,7 38,16" fill="#dc2626" />
          {/* Green Brow & Golden Snout */}
          <circle cx="32" cy="26" r="13" fill="#15803d" />
          <ellipse cx="32" cy="34" rx="12.5" ry="8.5" fill="#facc15" />
          {/* Fierce Red Eyes & Fiery Brows */}
          <circle cx="26.5" cy="25" r="3.4" fill="#ffffff" />
          <circle cx="37.5" cy="25" r="3.4" fill="#ffffff" />
          <circle cx="27" cy="25" r="1.8" fill="#dc2626" />
          <circle cx="37" cy="25" r="1.8" fill="#dc2626" />
          <path d="M21 20L29 23M43 20L35 23" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          {/* Fangs */}
          <polygon points="24,38 26,33 28,38" fill="#ffffff" />
          <polygon points="36,38 38,33 40,38" fill="#ffffff" />
        </>
      )}

      {characterId === 'bowser_jr' && (
        <>
          {/* Green Shell Rim & Yellow Shoulders */}
          <path d="M12 64V50C12 45 20 42 32 42C44 42 52 45 52 50V64H12Z" fill="#fde047" />
          {/* Orange Ponytail & Tiny Horns */}
          <polygon points="27,18 32,7 37,18" fill="#f97316" />
          <polygon points="20,21 17,13 24,18" fill="#f8fafc" />
          <polygon points="44,21 47,13 40,18" fill="#f8fafc" />
          {/* Yellow Head & Eyes */}
          <circle cx="32" cy="30" r="13" fill="#fde047" />
          <ellipse cx="26.5" cy="27" rx="3" ry="3.8" fill="#ffffff" />
          <ellipse cx="37.5" cy="27" rx="3" ry="3.8" fill="#ffffff" />
          <circle cx="27" cy="27.2" r="1.8" fill="#0f172a" />
          <circle cx="37" cy="27.2" r="1.8" fill="#0f172a" />
          {/* Iconic White Toothy-Grin Bandana */}
          <path d="M18 32Q32 30 46 32L44 43Q32 46 20 43Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <path d="M22 36Q32 41 42 36" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="26" y1="35" x2="26" y2="39" stroke="#0f172a" strokeWidth="1.4" />
          <line x1="32" y1="36" x2="32" y2="40" stroke="#0f172a" strokeWidth="1.4" />
          <line x1="38" y1="35" x2="38" y2="39" stroke="#0f172a" strokeWidth="1.4" />
        </>
      )}

      {characterId === 'cheep_cheep' && (
        <>
          {/* Tail Fin & Spiky Golden Dorsal Fin */}
          <polygon points="12,26 5,19 8,33 5,45 13,38" fill="#facc15" />
          <polygon points="24,17 29,8 34,16 39,10 41,19" fill="#facc15" />
          {/* Plump Red Fish Body & Cream Belly */}
          <ellipse cx="32" cy="34" rx="18" ry="16" fill="#ef4444" />
          <ellipse cx="32" cy="43" rx="13" ry="7" fill="#fef9c3" />
          {/* Golden Wing Fin */}
          <ellipse cx="22" cy="36" rx="7" ry="4.5" fill="#facc15" transform="rotate(-18 22 36)" />
          {/* Big Round Eyes & Puckered Pink Lips */}
          <circle cx="37" cy="27" r="4.8" fill="#ffffff" />
          <circle cx="38" cy="27" r="2.4" fill="#0f172a" />
          <ellipse cx="50" cy="35" rx="4.2" ry="5" fill="#f472b6" />
          <circle cx="51.5" cy="35" r="1.5" fill="#9d174d" />
        </>
      )}

      {characterId === 'fish_bone' && (
        <>
          {/* Bony Spine & Ribcage */}
          <line x1="12" y1="36" x2="28" y2="36" stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round" />
          <polygon points="12,36 6,25 9,36 6,47" fill="#e2e8f0" />
          <line x1="18" y1="27" x2="18" y2="45" stroke="#f1f5f9" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="23" y1="28" x2="23" y2="44" stroke="#f1f5f9" strokeWidth="2.8" strokeLinecap="round" />
          {/* Fish Skull & Toothy Jaw */}
          <circle cx="38" cy="30" r="13" fill="#f1f5f9" />
          <path d="M28 38H52L49 45H31Z" fill="#e2e8f0" />
          {/* Hollow Eye Socket with Cyan Glow */}
          <circle cx="41" cy="27" r="4.5" fill="#0f172a" />
          <circle cx="41.5" cy="27" r="2" fill="#38bdf8" />
          {/* Jagged Teeth */}
          <polygon points="34,38 36,33 38,38" fill="#0f172a" />
          <polygon points="40,38 42,33 44,38" fill="#0f172a" />
          <polygon points="46,38 48,33 50,38" fill="#0f172a" />
        </>
      )}

      {characterId === 'villager_boy' && (
        <>
          <path d="M16 58C16 46 23 41 32 41C41 41 48 46 48 58Z" fill="#ef4444" />
          <circle cx="32" cy="51" r="5.5" fill="#ffffff" />
          <circle cx="32" cy="29" r="14" fill="#f9d3b4" />
          <path d="M17 27C18 15 26 11 33 11C41 11 47 16 47 26L41 21L35 26L29 20L23 26Z" fill="#5c3317" />
          <circle cx="26" cy="29" r="2.6" fill="#0f172a" />
          <circle cx="38" cy="29" r="2.6" fill="#0f172a" />
          <circle cx="32" cy="33" r="3" fill="#ef4444" />
          <circle cx="22" cy="34" r="2.8" fill="#fb7185" />
          <circle cx="42" cy="34" r="2.8" fill="#fb7185" />
        </>
      )}

      {characterId === 'villager_girl' && (
        <>
          <path d="M16 58C16 46 23 41 32 41C41 41 48 46 48 58Z" fill="#f472b6" />
          <circle cx="19" cy="33" r="6" fill="#d97706" />
          <circle cx="45" cy="33" r="6" fill="#d97706" />
          <circle cx="32" cy="29" r="14" fill="#f9d3b4" />
          <path d="M18 26C19 15 25 11 32 11C39 11 45 15 46 26C41 21 23 21 18 26Z" fill="#d97706" />
          <polygon points="40,14 48,11 45,19" fill="#f472b6" />
          <circle cx="26" cy="29" r="2.6" fill="#0f172a" />
          <circle cx="38" cy="29" r="2.6" fill="#0f172a" />
          <circle cx="32" cy="33" r="2.8" fill="#ef4444" />
          <circle cx="22" cy="34" r="2.8" fill="#fb7185" />
          <circle cx="42" cy="34" r="2.8" fill="#fb7185" />
        </>
      )}

      {characterId === 'peach' && (
        <>
          <path d="M15 58C15 45 23 40 32 40C41 40 49 45 49 58Z" fill="#f472b6" />
          <circle cx="32" cy="48" r="3.5" fill="#2563eb" />
          <path d="M16 29C16 17 23 13 32 13C41 13 48 17 48 29L48 42H16Z" fill="#facc15" />
          <circle cx="32" cy="29" r="12.5" fill="#fad6bc" />
          <path d="M19 26C23 18 41 18 45 26" fill="#facc15" />
          <polygon points="24,16 26,8 30,13 32,6 34,13 38,8 40,16" fill="#facc15" />
          <circle cx="32" cy="13" r="1.8" fill="#2563eb" />
          <circle cx="27" cy="29" r="2.4" fill="#0ea5e9" />
          <circle cx="37" cy="29" r="2.4" fill="#0ea5e9" />
          <path d="M29 36Q32 39 35 36" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {characterId === 'daisy' && (
        <>
          <path d="M15 58C15 45 23 40 32 40C41 40 49 45 49 58Z" fill="#f97316" />
          <circle cx="32" cy="48" r="3.5" fill="#16a34a" />
          <path d="M15 31C15 17 23 13 32 13C41 13 49 17 49 31L51 40H13Z" fill="#92400e" />
          <circle cx="32" cy="29" r="12.5" fill="#fad6bc" />
          <path d="M19 25C23 18 41 18 45 25" fill="#92400e" />
          <polygon points="24,16 27,8 32,12 37,8 40,16" fill="#facc15" />
          <circle cx="32" cy="13" r="1.8" fill="#16a34a" />
          <circle cx="27" cy="29" r="2.4" fill="#2563eb" />
          <circle cx="37" cy="29" r="2.4" fill="#2563eb" />
          <path d="M29 36Q32 39 35 36" fill="none" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {characterId === 'rosalina' && (
        <>
          <path d="M15 58C15 45 23 40 32 40C41 40 49 45 49 58Z" fill="#38bdf8" />
          <circle cx="32" cy="48" r="3.2" fill="#facc15" />
          <path d="M16 30C16 17 23 13 32 13C41 13 48 17 48 30L48 43H16Z" fill="#fef3c7" />
          <circle cx="32" cy="29" r="12.5" fill="#fad6bc" />
          <path d="M19 22C24 17 31 20 33 33L19 32Z" fill="#fef3c7" />
          <polygon points="25,16 27,9 32,12 37,9 39,16" fill="#e2e8f0" />
          <circle cx="37" cy="29" r="2.4" fill="#0ea5e9" />
          <path d="M30 36Q33 38.5 36 36" fill="none" stroke="#f472b6" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {characterId === 'pauline' && (
        <>
          <path d="M16 58C16 46 23 41 32 41C41 41 48 46 48 58Z" fill="#dc2626" />
          <path d="M27 42L32 54L37 42Z" fill="#facc15" />
          <path d="M17 29C17 18 24 14 32 14C40 14 47 18 47 29L48 43H16Z" fill="#3b1e10" />
          <circle cx="32" cy="30" r="12" fill="#f7cfad" />
          <ellipse cx="32" cy="18" rx="22" ry="5" fill="#991b1b" />
          <path d="M21 18L24 8H40L43 18Z" fill="#dc2626" />
          <rect x="22" y="15" width="20" height="3" fill="#facc15" />
          <circle cx="20" cy="34" r="3" fill="none" stroke="#facc15" strokeWidth="1.8" />
          <circle cx="44" cy="34" r="3" fill="none" stroke="#facc15" strokeWidth="1.8" />
          <circle cx="27.5" cy="29" r="2.3" fill="#2563eb" />
          <circle cx="36.5" cy="29" r="2.3" fill="#2563eb" />
          <path d="M28 36H36" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}

      {(characterId === 'baby_peach' || characterId === 'baby_daisy' || characterId === 'baby_rosalina') && (
        <>
          <path
            d="M19 58C19 48 24 44 32 44C40 44 45 48 45 58Z"
            fill={characterId === 'baby_peach' ? '#f9a8d4' : characterId === 'baby_daisy' ? '#fb923c' : '#67e8f9'}
          />
          <circle cx="32" cy="31" r="14" fill="#fad6bc" />
          <path
            d="M18 28C19 18 25 15 32 15C39 15 45 18 46 28C41 23 23 23 18 28Z"
            fill={characterId === 'baby_peach' ? '#facc15' : characterId === 'baby_daisy' ? '#92400e' : '#fef3c7'}
          />
          {characterId === 'baby_rosalina' && (
            <path d="M18 24C23 20 29 24 31 35L18 33Z" fill="#fef3c7" />
          )}
          <polygon
            points="25,16 28,9 32,12 36,9 39,16"
            fill={characterId === 'baby_rosalina' ? '#e2e8f0' : '#facc15'}
          />
          {characterId !== 'baby_rosalina' && <circle cx="27" cy="31" r="2.6" fill="#0ea5e9" />}
          <circle cx="37" cy="31" r="2.6" fill="#0ea5e9" />
          <circle cx="22" cy="35" r="2.4" fill="#fb7185" />
          <circle cx="42" cy="35" r="2.4" fill="#fb7185" />
          <circle cx="32" cy="39" r="3" fill="#fde047" />
          <circle cx="32" cy="39" r="1.4" fill="#f97316" />
        </>
      )}

      {characterId === 'inkling_boy' && (
        <>
          <path d="M16 58C16 46 23 41 32 41C41 41 48 46 48 58Z" fill="#0f172a" />
          <rect x="27" y="46" width="10" height="8" rx="2" fill="#2563eb" />
          <circle cx="32" cy="30" r="13" fill="#f6cfaf" />
          <path d="M18 26C19 15 26 11 35 11C43 11 47 17 46 25C41 21 24 21 18 26Z" fill="#2563eb" />
          <path d="M31 12L43 6L40 16Z" fill="#2563eb" />
          <rect x="20" y="25" width="24" height="8" rx="4" fill="#0f172a" />
          <circle cx="26.5" cy="29" r="3.2" fill="#ffffff" />
          <circle cx="37.5" cy="29" r="3.2" fill="#ffffff" />
          <circle cx="27" cy="29" r="1.8" fill="#2563eb" />
          <circle cx="37" cy="29" r="1.8" fill="#2563eb" />
          <path d="M29 37Q32 39.5 35 37" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {characterId === 'inkling_girl' && (
        <>
          <path d="M16 58C16 46 23 41 32 41C41 41 48 46 48 58Z" fill="#f8fafc" />
          <rect x="27" y="46" width="10" height="8" rx="2" fill="#f97316" />
          <rect x="14" y="26" width="8" height="20" rx="4" fill="#f97316" />
          <rect x="42" y="26" width="8" height="20" rx="4" fill="#f97316" />
          <circle cx="32" cy="30" r="13" fill="#f6cfaf" />
          <path d="M18 26C19 15 26 11 32 11C38 11 45 15 46 26C41 21 23 21 18 26Z" fill="#f97316" />
          <rect x="13" y="24" width="5" height="9" rx="2.5" fill="#a3e635" />
          <rect x="46" y="24" width="5" height="9" rx="2.5" fill="#a3e635" />
          <rect x="20" y="25" width="24" height="8" rx="4" fill="#0f172a" />
          <circle cx="26.5" cy="29" r="3.2" fill="#ffffff" />
          <circle cx="37.5" cy="29" r="3.2" fill="#ffffff" />
          <circle cx="27" cy="29" r="1.8" fill="#f97316" />
          <circle cx="37" cy="29" r="1.8" fill="#f97316" />
          <path d="M29 37Q32 39.5 35 37" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {characterId === 'donkey_kong' && (
        <>
          <path d="M12 58C12 44 20 39 32 39C44 39 52 44 52 58Z" fill="#6d3b1a" />
          <path d="M21 58C21 48 25 44 32 44C39 44 43 48 43 58Z" fill="#e6b88a" />
          <polygon points="29,43 35,43 37,56 32,59 27,56" fill="#dc2626" />
          <rect x="30" y="49" width="4" height="4" fill="#facc15" />
          <circle cx="17" cy="29" r="5" fill="#e6b88a" />
          <circle cx="47" cy="29" r="5" fill="#e6b88a" />
          <circle cx="32" cy="28" r="14" fill="#6d3b1a" />
          <polygon points="28,15 32,7 36,15" fill="#6d3b1a" />
          <ellipse cx="32" cy="34" rx="11.5" ry="8.5" fill="#e6b88a" />
          <rect x="21" y="21" width="22" height="5" rx="2.5" fill="#4c2810" />
          <circle cx="26.5" cy="26" r="2.8" fill="#ffffff" />
          <circle cx="37.5" cy="26" r="2.8" fill="#ffffff" />
          <circle cx="26.5" cy="26" r="1.5" fill="#0f172a" />
          <circle cx="37.5" cy="26" r="1.5" fill="#0f172a" />
          <path d="M25 36Q32 41 39 36" fill="none" stroke="#4c2810" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}

      {characterId === 'bully_cullibug' && (
        <>
          <path d="M13 58C13 44 21 39 32 39C43 39 51 44 51 58Z" fill="#111827" />
          <path d="M16 58C16 47 22 43 32 43C42 43 48 47 48 58Z" fill="#312e81" />
          <path d="M16 24C10 21 9 12 16 9C16 14 19 18 23 20Z" fill="#facc15" />
          <path d="M48 24C54 21 55 12 48 9C48 14 45 18 41 20Z" fill="#facc15" />
          <circle cx="32" cy="30" r="14.5" fill="#1e1b4b" />
          <path d="M22 26L29 29L22 32Z" fill="#fef08a" />
          <path d="M42 26L35 29L42 32Z" fill="#fef08a" />
          <path d="M25 37H39" stroke="#facc15" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="27,37 29,34 31,37" fill="#ffffff" />
          <polygon points="33,37 35,34 37,37" fill="#ffffff" />
        </>
      )}

      {characterId === 'cow' && (
        <>
          <path d="M14 58C14 45 22 40 32 40C42 40 50 45 50 58Z" fill="#f8fafc" />
          <circle cx="22" cy="50" r="4.5" fill="#1e293b" />
          <circle cx="41" cy="52" r="4" fill="#1e293b" />
          <path d="M22 42H42" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="46" r="3.8" fill="#facc15" />
          <ellipse cx="16" cy="24" rx="5.5" ry="3" fill="#1e293b" />
          <ellipse cx="48" cy="24" rx="5.5" ry="3" fill="#1e293b" />
          <polygon points="21,17 18,9 26,15" fill="#fef3c7" />
          <polygon points="43,17 46,9 38,15" fill="#fef3c7" />
          <circle cx="32" cy="28" r="14" fill="#f8fafc" />
          <circle cx="39" cy="20" r="5.5" fill="#1e293b" />
          <ellipse cx="32" cy="34" rx="11.5" ry="7.5" fill="#fda4af" />
          <circle cx="27" cy="33" r="1.7" fill="#0f172a" />
          <circle cx="37" cy="33" r="1.7" fill="#0f172a" />
          <circle cx="25.5" cy="24.5" r="2.5" fill="#0f172a" />
          <circle cx="38.5" cy="24.5" r="2.5" fill="#0f172a" />
        </>
      )}

      {characterId === 'penguin' && (
        <>
          <path d="M15 58C15 45 22 40 32 40C42 40 49 45 49 58Z" fill="#1e293b" />
          <path d="M21 58C21 47 25 43 32 43C39 43 43 47 43 58Z" fill="#f8fafc" />
          <circle cx="32" cy="28" r="14" fill="#1e293b" />
          <circle cx="26.5" cy="29" r="7" fill="#f8fafc" />
          <circle cx="37.5" cy="29" r="7" fill="#f8fafc" />
          <polygon points="22,18 14,12 24,15" fill="#facc15" />
          <polygon points="42,18 50,12 40,15" fill="#facc15" />
          <circle cx="26.5" cy="27.5" r="2.3" fill="#0f172a" />
          <circle cx="37.5" cy="27.5" r="2.3" fill="#0f172a" />
          <polygon points="26,32 38,32 32,39" fill="#f97316" />
        </>
      )}

      {characterId === 'stingby' && (
        <>
          <ellipse cx="14" cy="36" rx="7" ry="11" fill="#bae6fd" opacity="0.8" />
          <ellipse cx="50" cy="36" rx="7" ry="11" fill="#bae6fd" opacity="0.8" />
          <path d="M16 58C16 45 22 40 32 40C42 40 48 45 48 58Z" fill="#facc15" />
          <rect x="18" y="47" width="28" height="4.5" rx="2" fill="#18181b" />
          <rect x="17" y="54" width="30" height="4" fill="#18181b" />
          <path d="M24 17L19 10" stroke="#18181b" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M40 17L45 10" stroke="#18181b" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="19" cy="10" r="2.5" fill="#facc15" />
          <circle cx="45" cy="10" r="2.5" fill="#facc15" />
          <circle cx="32" cy="28" r="14" fill="#facc15" />
          <path d="M19 22C22 15 42 15 45 22Z" fill="#18181b" />
          <ellipse cx="26.5" cy="28" rx="4.6" ry="5.6" fill="#ffffff" />
          <ellipse cx="37.5" cy="28" rx="4.6" ry="5.6" fill="#ffffff" />
          <circle cx="26.5" cy="28" r="2.2" fill="#0f172a" />
          <circle cx="37.5" cy="28" r="2.2" fill="#0f172a" />
          <path d="M28 36Q32 39 36 36" stroke="#18181b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}

      {characterId === 'dry_bones' && (
        <>
          <path d="M14 58C14 44 21 39 32 39C43 39 50 44 50 58Z" fill="#334155" />
          <path d="M18 58C18 47 23 42 32 42C41 42 46 47 46 58Z" fill="#e2e8f0" />
          <circle cx="32" cy="27" r="13.5" fill="#f1f5f9" />
          <ellipse cx="32" cy="35" rx="11" ry="7" fill="#f8fafc" />
          <ellipse cx="26" cy="26" rx="4.4" ry="5.2" fill="#18181b" />
          <ellipse cx="38" cy="26" rx="4.4" ry="5.2" fill="#18181b" />
          <circle cx="26" cy="26" r="2" fill="#facc15" />
          <circle cx="38" cy="26" r="2" fill="#facc15" />
          <circle cx="29" cy="34" r="1.4" fill="#18181b" />
          <circle cx="35" cy="34" r="1.4" fill="#18181b" />
          <path d="M24 38.5H40" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}

      {characterId === 'koopa_troopa' && (
        <>
          <path d="M14 58C14 44 21 39 32 39C43 39 50 44 50 58Z" fill="#16a34a" />
          <path d="M20 58C20 47 25 43 32 43C39 43 44 47 44 58Z" fill="#fef08a" />
          <circle cx="32" cy="28" r="13.5" fill="#facc15" />
          <ellipse cx="32" cy="35" rx="11" ry="7" fill="#fde047" />
          <ellipse cx="27" cy="25" rx="3.4" ry="4.5" fill="#ffffff" />
          <ellipse cx="37" cy="25" rx="3.4" ry="4.5" fill="#ffffff" />
          <circle cx="27" cy="25.5" r="1.8" fill="#0f172a" />
          <circle cx="37" cy="25.5" r="1.8" fill="#0f172a" />
          <path d="M27 36Q32 39 37 36" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {characterId === 'lakitu' && (
        <>
          <ellipse cx="32" cy="53" rx="20" ry="7" fill="#f8fafc" />
          <circle cx="22" cy="51" r="6" fill="#f8fafc" />
          <circle cx="42" cy="51" r="6" fill="#f8fafc" />
          <circle cx="32" cy="29" r="13.5" fill="#facc15" />
          <path d="M32 15L29 8M32 15L35 9" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="26" cy="27" r="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2.4" />
          <circle cx="38" cy="27" r="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2.4" />
          <line x1="31" y1="27" x2="33" y2="27" stroke="#0f172a" strokeWidth="2.4" />
          <circle cx="26" cy="27" r="2" fill="#0f172a" />
          <circle cx="38" cy="27" r="2" fill="#0f172a" />
          <path d="M27 36Q32 39 37 36" stroke="#78350f" strokeWidth="2" fill="none" />
        </>
      )}

      {characterId === 'birdo' && (
        <>
          <path d="M16 58C16 45 22 40 32 40C42 40 48 45 48 58Z" fill="#ec4899" />
          <polygon points="24,16 32,20 28,11" fill="#ef4444" />
          <polygon points="40,16 32,20 36,11" fill="#ef4444" />
          <circle cx="32" cy="18" r="3.5" fill="#ef4444" />
          <circle cx="32" cy="29" r="13.5" fill="#ec4899" />
          <ellipse cx="32" cy="36" rx="7" ry="6" fill="#f472b6" />
          <circle cx="32" cy="36" r="3" fill="#0f172a" />
          <ellipse cx="25.5" cy="25.5" rx="3.5" ry="4.5" fill="#ffffff" />
          <ellipse cx="38.5" cy="25.5" rx="3.5" ry="4.5" fill="#ffffff" />
          <circle cx="25.5" cy="25.5" r="2" fill="#0f172a" />
          <circle cx="38.5" cy="25.5" r="2" fill="#0f172a" />
        </>
      )}

      {characterId === 'nabbit' && (
        <>
          <path d="M15 58C15 44 22 39 32 39C42 39 49 44 49 58Z" fill="#7e22ce" />
          <ellipse cx="25" cy="13" rx="4" ry="9" fill="#7e22ce" />
          <ellipse cx="39" cy="13" rx="4" ry="9" fill="#7e22ce" />
          <circle cx="32" cy="29" r="13" fill="#7e22ce" />
          <path d="M19 31C22 28 42 28 45 31L42 42H22Z" fill="#f8fafc" />
          <path d="M23 35H41" stroke="#0f172a" strokeWidth="2.2" />
          <circle cx="26.5" cy="25" r="2.5" fill="#0f172a" />
          <circle cx="37.5" cy="25" r="2.5" fill="#0f172a" />
        </>
      )}

      {characterId === 'piranha_plant' && (
        <>
          <rect x="20" y="44" width="24" height="14" fill="#16a34a" />
          <rect x="17" y="40" width="30" height="6" rx="2" fill="#22c55e" />
          <circle cx="32" cy="26" r="14" fill="#dc2626" />
          <circle cx="25" cy="19" r="3" fill="#f8fafc" />
          <circle cx="39" cy="19" r="3" fill="#f8fafc" />
          <circle cx="32" cy="15" r="2.6" fill="#f8fafc" />
          <ellipse cx="32" cy="31" rx="10.5" ry="6" fill="#f8fafc" />
          <ellipse cx="32" cy="31" rx="7.5" ry="3.5" fill="#7f1d1d" />
        </>
      )}

      {characterId === 'spike' && (
        <>
          <path d="M15 58C15 45 22 40 32 40C42 40 49 45 49 58Z" fill="#16a34a" />
          <polygon points="26,18 32,7 38,18" fill="#2563eb" />
          <circle cx="32" cy="28" r="14" fill="#22c55e" />
          <ellipse cx="26" cy="25" rx="3.8" ry="4.5" fill="#ffffff" />
          <ellipse cx="38" cy="25" rx="3.8" ry="4.5" fill="#ffffff" />
          <circle cx="26" cy="25" r="2" fill="#0f172a" />
          <circle cx="38" cy="25" r="2" fill="#0f172a" />
          <ellipse cx="32" cy="35" rx="8" ry="4.5" fill="#fef08a" stroke="#15803d" strokeWidth="1.5" />
        </>
      )}

      {characterId === 'wiggler' && (
        <>
          <path d="M15 58C15 45 22 40 32 40C42 40 49 45 49 58Z" fill="#facc15" />
          <circle cx="27" cy="12" r="3.5" fill="#ffffff" />
          <circle cx="37" cy="12" r="3.5" fill="#ffffff" />
          <circle cx="32" cy="12" r="3.5" fill="#facc15" />
          <circle cx="32" cy="29" r="14" fill="#facc15" />
          <circle cx="32" cy="33" r="4.5" fill="#f97316" />
          <circle cx="25" cy="26" r="2.6" fill="#0f172a" />
          <circle cx="39" cy="26" r="2.6" fill="#0f172a" />
        </>
      )}

      {characterId === 'hammer_bro' && (
        <>
          <path d="M15 58C15 44 22 39 32 39C42 39 49 44 49 58Z" fill="#15803d" />
          <circle cx="32" cy="29" r="13.5" fill="#22c55e" />
          <path d="M18 26C18 15 46 15 46 26Z" fill="#166534" />
          <rect x="18" y="23" width="28" height="3.5" fill="#f8fafc" />
          <ellipse cx="26.5" cy="29" rx="3.4" ry="4" fill="#ffffff" />
          <ellipse cx="37.5" cy="29" rx="3.4" ry="4" fill="#ffffff" />
          <circle cx="26.5" cy="29" r="1.8" fill="#0f172a" />
          <circle cx="37.5" cy="29" r="1.8" fill="#0f172a" />
          <path d="M27 37H37" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {characterId === 'sidestepper' && (
        <>
          <circle cx="15" cy="36" r="6" fill="#ef4444" />
          <circle cx="49" cy="36" r="6" fill="#ef4444" />
          <ellipse cx="32" cy="35" rx="16" ry="12" fill="#ef4444" />
          <ellipse cx="32" cy="39" rx="11" ry="6" fill="#fef3c7" />
          <circle cx="25" cy="19" r="4.5" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
          <circle cx="39" cy="19" r="4.5" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
          <circle cx="25" cy="19" r="2" fill="#0f172a" />
          <circle cx="39" cy="19" r="2" fill="#0f172a" />
        </>
      )}

      {characterId === 'cataquack' && (
        <>
          <path d="M15 58C15 44 22 39 32 39C42 39 49 44 49 58Z" fill="#2563eb" />
          <polygon points="28,15 32,7 36,15" fill="#22c55e" />
          <circle cx="32" cy="29" r="14" fill="#2563eb" />
          <ellipse cx="32" cy="36" rx="13" ry="5" fill="#f97316" />
          <circle cx="26" cy="25" r="3.6" fill="#ffffff" />
          <circle cx="38" cy="25" r="3.6" fill="#ffffff" />
          <circle cx="26" cy="25" r="1.9" fill="#0f172a" />
          <circle cx="38" cy="25" r="1.9" fill="#0f172a" />
        </>
      )}

      {characterId === 'monty_mole' && (
        <>
          <path d="M15 58C15 44 22 39 32 39C42 39 49 44 49 58Z" fill="#92400e" />
          <circle cx="32" cy="29" r="14" fill="#92400e" />
          <ellipse cx="32" cy="35" rx="10" ry="6.5" fill="#fef3c7" />
          <rect x="20" y="22" width="24" height="6" rx="2" fill="#0f172a" />
          <circle cx="32" cy="33" r="3" fill="#fb7185" />
        </>
      )}

      {characterId === 'pianta' && (
        <>
          <path d="M14 58C14 44 21 39 32 39C43 39 50 44 50 58Z" fill="#0ea5e9" />
          <path d="M22 14L32 19L42 14L36 9H28Z" fill="#16a34a" />
          <circle cx="32" cy="30" r="13.5" fill="#0ea5e9" />
          <circle cx="32" cy="34" r="4.5" fill="#fbbf24" />
          <circle cx="26" cy="26" r="2.8" fill="#ffffff" />
          <circle cx="38" cy="26" r="2.8" fill="#ffffff" />
          <circle cx="26" cy="26" r="1.5" fill="#0f172a" />
          <circle cx="38" cy="26" r="1.5" fill="#0f172a" />
        </>
      )}

      {characterId === 'rocky_wrench' && (
        <>
          <path d="M15 58C15 44 22 39 32 39C42 39 49 44 49 58Z" fill="#57534e" />
          <circle cx="32" cy="29" r="14" fill="#57534e" />
          <path d="M18 24C18 14 46 14 46 24Z" fill="#334155" />
          <rect x="20" y="23" width="24" height="6" rx="2" fill="#a855f7" />
          <ellipse cx="32" cy="35" rx="9" ry="5.5" fill="#fef3c7" />
          <circle cx="32" cy="33" r="2.8" fill="#fb7185" />
        </>
      )}

      {characterId === 'swoop' && (
        <>
          <polygon points="8,36 22,26 22,42" fill="#6b21a8" />
          <polygon points="56,36 42,26 42,42" fill="#6b21a8" />
          <polygon points="21,21 25,10 30,20" fill="#9333ea" />
          <polygon points="43,21 39,10 34,20" fill="#9333ea" />
          <circle cx="32" cy="31" r="13" fill="#9333ea" />
          <ellipse cx="32" cy="33" rx="4.5" ry="3" fill="#f472b6" />
          <circle cx="26" cy="26" r="3.4" fill="#ffffff" />
          <circle cx="38" cy="26" r="3.4" fill="#ffffff" />
          <circle cx="26" cy="26" r="1.8" fill="#0f172a" />
          <circle cx="38" cy="26" r="1.8" fill="#0f172a" />
        </>
      )}

      {characterId === 'pokey' && (
        <>
          <circle cx="32" cy="48" r="11" fill="#facc15" />
          <circle cx="32" cy="34" r="11" fill="#facc15" />
          <circle cx="32" cy="20" r="10.5" fill="#facc15" />
          <polygon points="26,11 32,5 38,11" fill="#ef4444" />
          <circle cx="28" cy="19" r="2" fill="#0f172a" />
          <circle cx="36" cy="19" r="2" fill="#0f172a" />
        </>
      )}

      {characterId === 'coin_coffer' && (
        <>
          <circle cx="27" cy="15" r="3.5" fill="#facc15" />
          <circle cx="37" cy="15" r="3.5" fill="#facc15" />
          <circle cx="32" cy="33" r="16" fill="#16a34a" />
          <ellipse cx="32" cy="37" rx="11" ry="8" fill="#4ade80" />
          <circle cx="26" cy="26" r="3.4" fill="#ffffff" />
          <circle cx="38" cy="26" r="3.4" fill="#ffffff" />
          <circle cx="26" cy="26" r="1.8" fill="#0f172a" />
          <circle cx="38" cy="26" r="1.8" fill="#0f172a" />
        </>
      )}

      {characterId === 'snowman' && (
        <>
          <circle cx="32" cy="48" r="13" fill="#f8fafc" />
          <rect x="20" y="34" width="24" height="5" rx="2" fill="#ef4444" />
          <circle cx="32" cy="27" r="12" fill="#f8fafc" />
          <rect x="20" y="14" width="24" height="3" fill="#1e293b" />
          <rect x="24" y="6" width="16" height="9" fill="#1e293b" />
          <polygon points="32,26 44,29 32,31" fill="#f97316" />
          <circle cx="27" cy="23" r="2" fill="#0f172a" />
          <circle cx="37" cy="23" r="2" fill="#0f172a" />
        </>
      )}

      {characterId === 'dolphin' && (
        <>
          <path d="M16 58C16 44 22 39 32 39C42 39 48 44 48 58Z" fill="#38bdf8" />
          <ellipse cx="32" cy="49" rx="8" ry="8" fill="#f8fafc" />
          <circle cx="32" cy="27" r="13.5" fill="#38bdf8" />
          <ellipse cx="32" cy="34" rx="10" ry="5" fill="#0284c7" />
          <circle cx="26" cy="25" r="2.2" fill="#0f172a" />
          <circle cx="38" cy="25" r="2.2" fill="#0f172a" />
        </>
      )}

      {characterId === 'para_biddybud' && (
        <>
          <ellipse cx="14" cy="34" rx="8" ry="5" fill="#f8fafc" />
          <ellipse cx="50" cy="34" rx="8" ry="5" fill="#f8fafc" />
          <circle cx="32" cy="34" r="15" fill="#ef4444" />
          <circle cx="24" cy="26" r="3" fill="#18181b" />
          <circle cx="40" cy="26" r="3" fill="#18181b" />
          <circle cx="26" cy="34" r="4" fill="#ffffff" />
          <circle cx="38" cy="34" r="4" fill="#ffffff" />
          <circle cx="26" cy="34" r="2" fill="#0f172a" />
          <circle cx="38" cy="34" r="2" fill="#0f172a" />
        </>
      )}

      {characterId === 'chargin_chuck' && (
        <>
          <path d="M14 58C14 44 21 39 32 39C43 39 50 44 50 58Z" fill="#7e22ce" />
          <circle cx="32" cy="29" r="13.5" fill="#22c55e" />
          <path d="M17 26C17 13 47 13 47 26Z" fill="#facc15" />
          <rect x="22" y="31" width="20" height="7" rx="2" fill="none" stroke="#f8fafc" strokeWidth="2.2" />
          <circle cx="26.5" cy="26.5" r="2.2" fill="#0f172a" />
          <circle cx="37.5" cy="26.5" r="2.2" fill="#0f172a" />
        </>
      )}
    </svg>
  );
};
