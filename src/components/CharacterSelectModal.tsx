import React, { useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';
import { CHARACTER_CATALOG, CharacterId } from '../game/types';
import { CharacterAvatar } from './CharacterAvatar';

interface CharacterSelectModalProps {
  equippedCharacter: CharacterId;
  onSelectCharacter: (charId: CharacterId) => void;
  onClose: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  equippedCharacter,
  onSelectCharacter,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filteredChars = q
    ? CHARACTER_CATALOG.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.species.toLowerCase().includes(q),
      )
    : CHARACTER_CATALOG;

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-white uppercase sm:text-2xl">
                Choose Your Racer
              </h2>
              <p className="text-xs text-slate-400">
                57 racers including Mario, Bowser, Peach, Koopa Troopa, Birdo, Nabbit, Wiggler &amp; Chargin&apos; Chuck
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter drivers..."
                className="w-40 rounded-xl border border-white/15 bg-slate-950 py-2 pr-3 pl-8 text-xs font-bold text-white outline-none focus:border-sky-400 sm:w-48"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-800 text-slate-200 transition hover:bg-slate-700"
              aria-label="Close Driver Select"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Character Roster Grid */}
        <div className="mt-4 grid flex-1 grid-cols-1 gap-3.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
          {filteredChars.map((char) => {
            const active = equippedCharacter === char.id;
            return (
              <div
                key={char.id}
                className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                  active
                    ? 'border-emerald-400 bg-emerald-950/35'
                    : 'border-white/15 bg-slate-950/75'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3.5">
                    <div
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white"
                      style={{ borderColor: char.hexPrimary }}
                    >
                      <CharacterAvatar characterId={char.id} className="h-full w-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-black text-white">{char.name}</h3>
                        {active && (
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div
                        className="text-xs font-bold tracking-wider uppercase"
                        style={{ color: char.hexPrimary }}
                      >
                        {char.species}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{char.tagline}</p>
                </div>

                <div className="mt-4 border-t border-white/10 pt-3">
                  {active ? (
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500/25 py-2 text-xs font-black text-emerald-300 uppercase"
                    >
                      <Check className="h-4 w-4" />
                      Selected
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectCharacter(char.id)}
                      className="w-full rounded-xl bg-sky-500 py-2 text-xs font-black text-slate-950 uppercase transition hover:bg-sky-400"
                    >
                      Select Driver
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
