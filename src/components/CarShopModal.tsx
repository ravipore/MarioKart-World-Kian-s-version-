import React, { useState } from 'react';
import { Check, Search, ShoppingBag, X } from 'lucide-react';
import { CAR_CATALOG, CarCategory, CarId, CarSpec } from '../game/types';

interface CarShopModalProps {
  equippedCar: CarId;
  onEquipCar: (carId: CarId) => void;
  onClose: () => void;
}

const CATEGORY_TABS: Array<{ id: 'all' | CarCategory; label: string }> = [
  { id: 'all', label: 'All (40)' },
  { id: 'kart', label: 'Karts' },
  { id: 'bike', label: 'Bikes' },
  { id: 'atv', label: 'ATVs' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'special', label: 'Special' },
];

const CarIllustration: React.FC<{ car: CarSpec }> = ({ car }) => {
  return (
    <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0" aria-hidden="true">
      <ellipse cx="60" cy="54" rx="46" ry="4" fill="#020617" fillOpacity="0.65" />

      {car.category === 'bike' && (
        <>
          <path d="M24 38L44 24H68L88 18L94 34L82 40H32Z" fill={car.hexPrimary} />
          <path d="M68 24L82 14L90 16" fill="none" stroke={car.hexAccent} strokeWidth="3.2" strokeLinecap="round" />
          <rect x="16" y="31" width="18" height="5" rx="2" fill={car.hexAccent} />
          <circle cx="30" cy="43" r="10.5" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
          <circle cx="30" cy="43" r="4.8" fill={car.hexAccent} />
          <circle cx="86" cy="43" r="10.5" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
          <circle cx="86" cy="43" r="4.8" fill={car.hexAccent} />
        </>
      )}

      {car.category === 'atv' && (
        <>
          <path d="M24 38L34 22H78L94 34L98 42H20L24 38Z" fill={car.hexPrimary} />
          <path d="M36 22L44 12H72L82 24" fill="none" stroke={car.hexAccent} strokeWidth="3.2" strokeLinejoin="round" />
          <rect x="82" y="34" width="18" height="6" rx="2" fill={car.hexAccent} />
          <circle cx="32" cy="43" r="11" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
          <circle cx="32" cy="43" r="5" fill="#cbd5e1" />
          <circle cx="84" cy="43" r="11" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
          <circle cx="84" cy="43" r="5" fill="#cbd5e1" />
        </>
      )}

      {car.category === 'heavy' && (
        <>
          <rect x="18" y="21" width="72" height="20" rx="4" fill={car.hexPrimary} />
          <path d="M74 22H94L104 34V42H74Z" fill={car.hexAccent} />
          <rect x="96" y="35" width="10" height="8" rx="2" fill="#e2e8f0" />
          <circle cx="31" cy="43" r="11" fill="#0f172a" stroke="#64748b" strokeWidth="2.5" />
          <circle cx="31" cy="43" r="5" fill={car.hexAccent} />
          <circle cx="85" cy="43" r="11" fill="#0f172a" stroke="#64748b" strokeWidth="2.5" />
          <circle cx="85" cy="43" r="5" fill={car.hexAccent} />
        </>
      )}

      {car.category === 'special' && (
        <>
          {car.id === 'cloud_9' ? (
            <>
              <circle cx="36" cy="36" r="12" fill={car.hexPrimary} />
              <circle cx="58" cy="31" r="15" fill={car.hexPrimary} />
              <circle cx="82" cy="36" r="12" fill={car.hexPrimary} />
              <rect x="28" y="42" width="62" height="6" rx="3" fill={car.hexAccent} />
            </>
          ) : car.id === 'carpet_flyer' ? (
            <>
              <path d="M14 38L30 30H94L106 36L92 42H16Z" fill={car.hexPrimary} stroke={car.hexAccent} strokeWidth="2.5" />
              <circle cx="33" cy="45" r="7.5" fill="#0f172a" stroke={car.hexAccent} strokeWidth="1.8" />
              <circle cx="86" cy="45" r="7.5" fill="#0f172a" stroke={car.hexAccent} strokeWidth="1.8" />
            </>
          ) : (
            <>
              <path d="M18 39L26 24H76L104 34V41H18Z" fill={car.hexPrimary} />
              <rect x="22" y="41" width="78" height="4" rx="2" fill={car.hexAccent} />
              <circle cx="33" cy="44" r="9.5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <circle cx="33" cy="44" r="4.5" fill={car.hexAccent} />
              <circle cx="85" cy="44" r="9.5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <circle cx="85" cy="44" r="4.5" fill={car.hexAccent} />
            </>
          )}
        </>
      )}

      {car.category === 'kart' && (
        <>
          <path d="M18 40L24 27H74L100 34V42H18V40Z" fill={car.hexPrimary} />
          <path d="M18 27L12 17H27L25 27" fill={car.hexAccent} />
          <rect x="52" y="32" width="38" height="4" rx="2" fill={car.hexAccent} />
          <circle cx="33" cy="44" r="9.5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="33" cy="44" r="4.5" fill="#e2e8f0" />
          <circle cx="85" cy="44" r="9.5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="85" cy="44" r="4.5" fill="#e2e8f0" />
        </>
      )}
    </svg>
  );
};

const StatBar: React.FC<{ label: string; value: number; colorClass: string }> = ({
  label,
  value,
  colorClass,
}) => (
  <div className="flex items-center gap-2 text-[11px]">
    <span className="w-16 font-semibold text-slate-400">{label}</span>
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${value * 10}%` }} />
    </div>
    <span className="tabular-nums w-5 text-right font-bold text-slate-300">{value}</span>
  </div>
);

export const CarShopModal: React.FC<CarShopModalProps> = ({
  equippedCar,
  onEquipCar,
  onClose,
}) => {
  const [category, setCategory] = useState<'all' | CarCategory>('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filteredCars = CAR_CATALOG.filter((car) => {
    if (category !== 'all' && car.category !== category) return false;
    if (q && !car.name.toLowerCase().includes(q) && !car.tagline.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-white uppercase sm:text-2xl">
                Vehicle Garage
              </h2>
              <p className="text-xs text-slate-400">
                40 Mario Kart World vehicles · All rides unlocked
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-800 text-slate-200 transition hover:bg-slate-700"
            aria-label="Close Vehicle Garage"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filter + Search */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TABS.map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-black uppercase transition ${
                    active
                      ? 'bg-amber-400 text-slate-950'
                      : 'border border-white/10 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicles..."
              className="w-44 rounded-xl border border-white/15 bg-slate-950 py-1.5 pr-3 pl-8 text-xs font-bold text-white outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Vehicle Grid */}
        <div className="mt-4 grid flex-1 grid-cols-1 gap-3.5 overflow-y-auto pr-1 md:grid-cols-2">
          {filteredCars.map((car) => {
            const equipped = equippedCar === car.id;

            return (
              <div
                key={car.id}
                className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                  equipped
                    ? 'border-emerald-400 bg-emerald-950/35'
                    : 'border-white/15 bg-slate-950/75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-black text-white">{car.name}</h3>
                      {equipped && (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 uppercase">
                          Equipped
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-extrabold tracking-wider text-sky-400 uppercase">
                      {car.category}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{car.tagline}</p>
                  </div>
                  <CarIllustration car={car} />
                </div>

                {/* Stat Bars */}
                <div className="mt-3 space-y-1.5">
                  <StatBar label="Speed" value={car.statSpeed} colorClass="bg-sky-400" />
                  <StatBar label="Accel" value={car.statAccel} colorClass="bg-emerald-400" />
                  <StatBar label="Handling" value={car.statHandling} colorClass="bg-amber-400" />
                </div>

                {/* Action Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs font-bold text-emerald-300 uppercase">Unlocked</span>

                  {equipped ? (
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500/25 px-4 py-2 text-xs font-black text-emerald-300 uppercase"
                    >
                      <Check className="h-4 w-4" />
                      Active
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEquipCar(car.id)}
                      className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-black text-slate-950 uppercase transition hover:bg-sky-400"
                    >
                      Equip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
