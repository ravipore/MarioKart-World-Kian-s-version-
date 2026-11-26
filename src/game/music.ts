import type { CourseId } from './types';

export type MusicTrackId = CourseId | 'battle' | 'title';

export type DrumStyle =
  | 'rock'
  | 'pop'
  | 'trance'
  | 'latin'
  | 'jazz'
  | 'march'
  | 'shanty'
  | 'funk';

export interface MapSongSpec {
  id: MusicTrackId;
  title: string;
  bpm: number;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  arpWave: OscillatorType;
  drumStyle: DrumStyle;
  leadVol: number;
  bassVol: number;
  arpVol: number;
  drumVol: number;
  /** 32 eighth-note steps (4 bars of 4/4). 0 = rest. */
  melody: number[];
  /** 32 eighth-note steps. 0 = rest. */
  bass: number[];
  /** 8 half-bar chords (MIDI note arrays) */
  chords: number[][];
}

// MIDI note constants for clean composition (0 = rest)
const _ = 0;
const C2 = 36, Cs2 = 37, D2 = 38, Ds2 = 39, E2 = 40, F2 = 41, Fs2 = 42, G2 = 43, Gs2 = 44, A2 = 45, As2 = 46, B2 = 47;
const C3 = 48, Cs3 = 49, D3 = 50, Ds3 = 51, E3 = 52, F3 = 53, Fs3 = 54, G3 = 55, Gs3 = 56, A3 = 57, As3 = 58, B3 = 59;
const C4 = 60, Cs4 = 61, D4 = 62, Ds4 = 63, E4 = 64, F4 = 65, Fs4 = 66, G4 = 67, Gs4 = 68, A4 = 69, As4 = 70, B4 = 71;
const C5 = 72, Cs5 = 73, D5 = 74, Ds5 = 75, E5 = 76, F5 = 77, Fs5 = 78, G5 = 79, Gs5 = 80, A5 = 81, As5 = 82, B5 = 83;
const C6 = 84, D6 = 86, E6 = 88;

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const MAP_SONGS: Record<MusicTrackId, MapSongSpec> = {
  title: {
    id: 'title',
    title: 'Grand Prix Horizon',
    bpm: 128,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'pop',
    leadVol: 0.14,
    bassVol: 0.15,
    arpVol: 0.07,
    drumVol: 0.11,
    melody: [
      G4, _, C5, _, E5, _, G5, _, F5, E5, D5, _, C5, _, D5, _,
      E5, _, C5, _, A4, _, C5, _, D5, _, B4, _, G4, _, _, _,
    ],
    bass: [
      C3, _, C3, _, G2, _, C3, _, F2, _, F2, _, G2, _, G2, _,
      A2, _, A2, _, F2, _, F2, _, G2, _, G2, _, G2, _, B2, _,
    ],
    chords: [
      [C4, E4, G4], [C4, E4, G4], [F4, A4, C5], [G4, B4, D5],
      [A4, C5, E5], [F4, A4, C5], [G4, B4, D5], [G4, B4, D5],
    ],
  },

  battle: {
    id: 'battle',
    title: 'Balloon Arena Clash',
    bpm: 150,
    leadWave: 'sawtooth',
    bassWave: 'square',
    arpWave: 'square',
    drumStyle: 'rock',
    leadVol: 0.13,
    bassVol: 0.13,
    arpVol: 0.06,
    drumVol: 0.16,
    melody: [
      E5, _, E5, G5, _, E5, D5, _, E5, _, G5, A5, B5, _, A5, _,
      G5, _, E5, D5, C5, _, D5, _, E5, _, B4, D5, E5, _, _, _,
    ],
    bass: [
      E2, E3, E2, E3, E2, E3, D3, _, C2, C3, C2, C3, D2, D3, D2, D3,
      E2, E3, E2, E3, C2, C3, D2, D3, E2, E3, B2, D3, E3, _, _, _,
    ],
    chords: [
      [E4, G4, B4], [E4, G4, B4], [C4, E4, G4], [D4, Fs4, A4],
      [E4, G4, B4], [C4, E4, G4], [D4, Fs4, A4], [E4, G4, B4],
    ],
  },

  mario_bros_circuit: {
    id: 'mario_bros_circuit',
    title: 'Red Cap Overdrive',
    bpm: 142,
    leadWave: 'square',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'rock',
    leadVol: 0.13,
    bassVol: 0.17,
    arpVol: 0.08,
    drumVol: 0.15,
    melody: [
      C5, _, E5, _, G5, _, E5, C5, D5, _, F5, _, A5, G5, F5, E5,
      D5, _, G5, _, B5, _, G5, _, C6, _, G5, E5, C5, _, _, _,
    ],
    bass: [
      C3, _, G2, _, C3, _, E3, _, F3, _, C3, _, F3, _, D3, _,
      G2, _, D3, _, G3, _, D3, _, C3, _, G2, _, C3, G2, E2, G2,
    ],
    chords: [
      [C4, E4, G4], [C4, E4, G4], [F4, A4, C5], [D4, F4, A4],
      [G4, B4, D5], [G4, B4, D5], [C4, E4, G4], [C4, E4, G4],
    ],
  },

  crown_city: {
    id: 'crown_city',
    title: 'Neon Boulevard Drift',
    bpm: 134,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    arpWave: 'sine',
    drumStyle: 'funk',
    leadVol: 0.12,
    bassVol: 0.14,
    arpVol: 0.08,
    drumVol: 0.14,
    melody: [
      A4, C5, E5, _, G5, _, E5, D5, C5, _, A4, _, G4, A4, C5, _,
      D5, F5, A5, _, G5, _, E5, _, C5, _, D5, E5, A4, _, _, _,
    ],
    bass: [
      F2, _, F3, _, E2, _, E3, _, A2, _, A3, _, G2, _, G3, _,
      D2, _, D3, _, G2, _, G3, _, C3, _, B2, _, A2, _, E2, _,
    ],
    chords: [
      [F4, A4, C5, E5], [E4, G4, B4, D5], [A4, C5, E5, G5], [G4, B4, D5],
      [D4, F4, A4, C5], [G4, B4, D5, F5], [C4, E4, G4, B4], [A4, C5, E5],
    ],
  },

  whistletop_summit: {
    id: 'whistletop_summit',
    title: 'Alpine Steam Whistle',
    bpm: 136,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'pop',
    leadVol: 0.16,
    bassVol: 0.16,
    arpVol: 0.08,
    drumVol: 0.13,
    melody: [
      D5, _, Fs5, A5, _, Fs5, D5, _, E5, G5, B5, _, A5, _, Fs5, _,
      G5, _, B5, A5, G5, _, Fs5, E5, D5, _, A4, Cs5, D5, _, _, _,
    ],
    bass: [
      D3, _, A2, _, D3, _, Fs3, _, G2, _, D3, _, A2, _, E3, _,
      G2, _, D3, _, A2, _, Cs3, _, D3, _, A2, _, D3, _, _, _,
    ],
    chords: [
      [D4, Fs4, A4], [D4, Fs4, A4], [G4, B4, D5], [A4, Cs5, E5],
      [G4, B4, D5], [A4, Cs5, E5], [D4, Fs4, A4], [D4, Fs4, A4],
    ],
  },

  dk_spaceport: {
    id: 'dk_spaceport',
    title: 'Orbital Barrel Thrust',
    bpm: 144,
    leadWave: 'sawtooth',
    bassWave: 'square',
    arpWave: 'triangle',
    drumStyle: 'trance',
    leadVol: 0.12,
    bassVol: 0.13,
    arpVol: 0.09,
    drumVol: 0.15,
    melody: [
      C5, _, G5, _, As5, _, G5, _, F5, _, Ds5, _, C5, _, _, _,
      Gs4, _, C5, Ds5, G5, _, F5, _, Ds5, _, D5, _, C5, _, _, _,
    ],
    bass: [
      C2, C3, C2, C3, C2, C3, G2, _, F2, F3, F2, F3, C2, C3, C2, _,
      Gs2, Gs3, Gs2, Gs3, As2, As3, As2, As3, G2, G3, G2, G3, C3, _, _, _,
    ],
    chords: [
      [C4, Ds4, G4], [C4, Ds4, G4], [F4, Gs4, C5], [C4, Ds4, G4],
      [Gs4, C5, Ds5], [As4, D5, F5], [G4, B4, D5], [C4, Ds4, G4],
    ],
  },

  desert_hills: {
    id: 'desert_hills',
    title: 'Mirage Ridge Caravan',
    bpm: 132,
    leadWave: 'triangle',
    bassWave: 'sawtooth',
    arpWave: 'sine',
    drumStyle: 'latin',
    leadVol: 0.16,
    bassVol: 0.13,
    arpVol: 0.07,
    drumVol: 0.14,
    melody: [
      E5, _, F5, Gs5, _, F5, E5, _, D5, _, F5, E5, D5, C5, B4, _,
      E5, _, Gs5, A5, _, Gs5, F5, E5, D5, C5, B4, C5, E5, _, _, _,
    ],
    bass: [
      E2, _, B2, _, E2, _, B2, _, D2, _, A2, _, E2, _, B2, _,
      E2, _, B2, _, F2, _, C3, _, D2, _, B2, _, E2, _, B2, _,
    ],
    chords: [
      [E4, Gs4, B4], [E4, Gs4, B4], [D4, F4, A4], [E4, Gs4, B4],
      [E4, Gs4, B4], [F4, A4, C5], [D4, F4, A4], [E4, Gs4, B4],
    ],
  },

  shy_guy_bazaar: {
    id: 'shy_guy_bazaar',
    title: 'Lanterns of the Souk',
    bpm: 128,
    leadWave: 'sine',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'latin',
    leadVol: 0.17,
    bassVol: 0.15,
    arpVol: 0.08,
    drumVol: 0.13,
    melody: [
      A4, B4, C5, E5, _, Ds5, C5, B4, A4, _, Gs4, B4, E5, _, _, _,
      F5, E5, Ds5, C5, B4, C5, Ds5, E5, C5, _, B4, Gs4, A4, _, _, _,
    ],
    bass: [
      A2, _, E3, _, A2, _, E3, _, F2, _, E2, _, E2, _, B2, _,
      D2, _, A2, _, B2, _, E2, _, A2, _, E2, _, A2, _, _, _,
    ],
    chords: [
      [A4, C5, E5], [A4, C5, E5], [F4, A4, C5], [E4, Gs4, B4],
      [D4, F4, A4], [E4, Gs4, B4], [A4, C5, E5], [A4, C5, E5],
    ],
  },

  wario_stadium: {
    id: 'wario_stadium',
    title: 'Dirt Pit Shredder',
    bpm: 152,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    arpWave: 'square',
    drumStyle: 'rock',
    leadVol: 0.13,
    bassVol: 0.15,
    arpVol: 0.06,
    drumVol: 0.17,
    melody: [
      D5, _, D5, F5, G5, _, Gs5, G5, F5, D5, C5, _, D5, _, _, _,
      A5, _, G5, F5, G5, _, F5, D5, C5, _, A4, C5, D5, _, _, _,
    ],
    bass: [
      D2, D2, D3, D2, D2, D2, F2, G2, As2, As2, C3, C3, D3, _, D2, _,
      A2, A2, G2, G2, F2, F2, D2, D2, C2, C2, A2, C3, D3, _, _, _,
    ],
    chords: [
      [D4, F4, A4], [D4, G4, As4], [As4, D5, F5], [D4, F4, A4],
      [A4, C5, E5], [G4, As4, D5], [C4, E4, G4], [D4, F4, A4],
    ],
  },

  airship_fortress: {
    id: 'airship_fortress',
    title: 'Ironclad Sky Armada',
    bpm: 130,
    leadWave: 'square',
    bassWave: 'sawtooth',
    arpWave: 'square',
    drumStyle: 'march',
    leadVol: 0.13,
    bassVol: 0.14,
    arpVol: 0.07,
    drumVol: 0.16,
    melody: [
      C5, _, _, G4, Gs4, _, G4, F4, G4, _, C5, D5, Ds5, _, D5, _,
      F5, _, Ds5, D5, C5, _, B4, C5, D5, _, G4, B4, C5, _, _, _,
    ],
    bass: [
      C2, _, C3, _, Gs2, _, G2, _, C2, _, C3, _, Gs2, _, G2, _,
      F2, _, C3, _, Gs2, _, G2, _, G2, _, B2, _, C3, _, G2, _,
    ],
    chords: [
      [C4, Ds4, G4], [Gs4, C5, Ds5], [C4, Ds4, G4], [Gs4, C5, Ds5],
      [F4, Gs4, C5], [G4, B4, D5], [G4, B4, D5], [C4, Ds4, G4],
    ],
  },

  dk_pass: {
    id: 'dk_pass',
    title: 'Snowbound Slalom',
    bpm: 138,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'pop',
    leadVol: 0.15,
    bassVol: 0.16,
    arpVol: 0.09,
    drumVol: 0.13,
    melody: [
      G5, _, E5, C5, D5, _, G4, _, A4, C5, E5, _, D5, _, _, _,
      G5, _, A5, G5, F5, E5, D5, _, C5, E5, G5, B5, C6, _, _, _,
    ],
    bass: [
      C3, _, G2, _, B2, _, G2, _, A2, _, E2, _, G2, _, D3, _,
      E2, _, B2, _, F2, _, G2, _, C3, _, G2, _, C3, _, _, _,
    ],
    chords: [
      [C4, E4, G4], [G4, B4, D5], [A4, C5, E5], [G4, B4, D5],
      [E4, G4, B4], [F4, A4, C5], [G4, B4, D5], [C4, E4, G4],
    ],
  },

  starview_peak: {
    id: 'starview_peak',
    title: 'Aurora Observatory',
    bpm: 124,
    leadWave: 'sine',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'trance',
    leadVol: 0.17,
    bassVol: 0.14,
    arpVol: 0.09,
    drumVol: 0.11,
    melody: [
      B5, _, Fs5, _, E5, _, Fs5, _, Gs5, _, E5, _, B4, _, _, _,
      Cs5, _, E5, _, Fs5, _, Gs5, B5, A5, _, Gs5, Fs5, E5, _, _, _,
    ],
    bass: [
      E3, _, B2, _, B2, _, Fs2, _, Cs3, _, Gs2, _, Gs2, _, Ds2, _,
      A2, _, E2, _, B2, _, Fs2, _, A2, _, B2, _, E3, _, _, _,
    ],
    chords: [
      [E4, Gs4, B4], [B4, Ds5, Fs5], [Cs4, E4, Gs4], [Gs4, B4, Ds5],
      [A4, Cs5, E5], [B4, Ds5, Fs5], [A4, Cs5, E5], [E4, Gs4, B4],
    ],
  },

  sky_high_sundae: {
    id: 'sky_high_sundae',
    title: 'Sugar Cloud Swirl',
    bpm: 146,
    leadWave: 'square',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'pop',
    leadVol: 0.12,
    bassVol: 0.15,
    arpVol: 0.09,
    drumVol: 0.13,
    melody: [
      F5, A5, C6, _, A5, G5, F5, _, D5, F5, A5, _, G5, _, _, _,
      As5, _, A5, G5, F5, _, D5, _, C5, E5, G5, As5, A5, _, F5, _,
    ],
    bass: [
      F3, _, C3, _, F3, _, A2, _, As2, _, F2, _, C3, _, G2, _,
      As2, _, F2, _, D3, _, A2, _, C3, _, G2, _, F2, _, C3, _,
    ],
    chords: [
      [F4, A4, C5, E5], [F4, A4, C5], [As4, D5, F5], [C4, E4, G4],
      [As4, D5, F5], [D4, F4, A4], [C4, E4, G4, As4], [F4, A4, C5],
    ],
  },

  wario_shipyard: {
    id: 'wario_shipyard',
    title: 'Galleon Cove Plunder',
    bpm: 134,
    leadWave: 'sawtooth',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'shanty',
    leadVol: 0.12,
    bassVol: 0.16,
    arpVol: 0.07,
    drumVol: 0.15,
    melody: [
      D5, _, D5, E5, F5, _, E5, D5, C5, _, A4, C5, D5, _, A4, _,
      D5, _, F5, G5, A5, _, G5, F5, E5, _, C5, E5, D5, _, _, _,
    ],
    bass: [
      D3, _, A2, _, D3, _, A2, _, C3, _, G2, _, D3, _, A2, _,
      D3, _, A2, _, F2, _, C3, _, C3, _, A2, _, D3, _, A2, _,
    ],
    chords: [
      [D4, F4, A4], [D4, F4, A4], [C4, E4, G4], [D4, F4, A4],
      [D4, F4, A4], [F4, A4, C5], [C4, E4, G4], [D4, F4, A4],
    ],
  },

  koopa_troopa_beach: {
    id: 'koopa_troopa_beach',
    title: 'Turquoise Calypso Bay',
    bpm: 126,
    leadWave: 'sine',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'latin',
    leadVol: 0.17,
    bassVol: 0.15,
    arpVol: 0.08,
    drumVol: 0.12,
    melody: [
      G4, C5, E5, _, G5, _, E5, _, F5, E5, D5, _, B4, _, G4, _,
      A4, C5, F5, _, E5, _, D5, _, C5, _, E5, G5, C6, _, _, _,
    ],
    bass: [
      C3, _, _, G2, C3, _, G2, _, F2, _, _, C3, G2, _, D3, _,
      F2, _, _, C3, G2, _, B2, _, C3, _, G2, _, C3, _, _, _,
    ],
    chords: [
      [C4, E4, G4], [C4, E4, G4], [F4, A4, C5], [G4, B4, D5],
      [F4, A4, C5], [G4, B4, D5], [C4, E4, G4], [C4, E4, G4],
    ],
  },

  faraway_oasis: {
    id: 'faraway_oasis',
    title: 'Savannah Waterfall Groove',
    bpm: 130,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'latin',
    leadVol: 0.16,
    bassVol: 0.16,
    arpVol: 0.09,
    drumVol: 0.13,
    melody: [
      G4, A4, B4, D5, _, E5, D5, B4, A4, _, B4, D5, E5, _, _, _,
      G5, _, E5, D5, B4, _, A4, G4, A4, B4, D5, B4, G4, _, _, _,
    ],
    bass: [
      G2, _, D3, _, G2, _, D3, _, E2, _, B2, _, A2, _, E3, _,
      C3, _, G2, _, G2, _, D3, _, D2, _, A2, _, G2, _, D3, _,
    ],
    chords: [
      [G4, B4, D5], [G4, B4, D5], [E4, G4, B4], [A4, C5, E5],
      [C4, E4, G4], [G4, B4, D5], [D4, Fs4, A4], [G4, B4, D5],
    ],
  },

  peach_beach: {
    id: 'peach_beach',
    title: 'Parasol Promenade',
    bpm: 132,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'pop',
    leadVol: 0.15,
    bassVol: 0.15,
    arpVol: 0.08,
    drumVol: 0.12,
    melody: [
      B4, D5, G5, _, Fs5, _, D5, _, E5, Fs5, G5, _, D5, _, _, _,
      C5, E5, A5, _, G5, _, Fs5, _, D5, _, Fs5, A5, G5, _, _, _,
    ],
    bass: [
      G2, _, D3, _, B2, _, Fs2, _, C3, _, G2, _, G2, _, D3, _,
      A2, _, E2, _, D3, _, A2, _, D3, _, A2, _, G2, _, _, _,
    ],
    chords: [
      [G4, B4, D5], [B4, D5, Fs5], [C4, E4, G4], [G4, B4, D5],
      [A4, C5, E5], [D4, Fs4, A4], [D4, Fs4, A4], [G4, B4, D5],
    ],
  },

  peach_stadium: {
    id: 'peach_stadium',
    title: 'Royal Crown Fanfare',
    bpm: 144,
    leadWave: 'square',
    bassWave: 'triangle',
    arpWave: 'sawtooth',
    drumStyle: 'march',
    leadVol: 0.13,
    bassVol: 0.16,
    arpVol: 0.06,
    drumVol: 0.15,
    melody: [
      D5, _, D5, D5, E5, _, Fs5, _, G5, _, A5, _, Fs5, _, D5, _,
      B5, _, A5, G5, A5, _, Fs5, D5, E5, _, A4, Cs5, D5, _, _, _,
    ],
    bass: [
      D3, _, A2, _, D3, _, A2, _, G2, _, D3, _, D3, _, A2, _,
      G2, _, D3, _, Fs2, _, B2, _, A2, _, E2, _, D3, _, A2, _,
    ],
    chords: [
      [D4, Fs4, A4], [D4, Fs4, A4], [G4, B4, D5], [D4, Fs4, A4],
      [G4, B4, D5], [Fs4, A4, D5], [A4, Cs5, E5], [D4, Fs4, A4],
    ],
  },

  mushroom_kingdom: {
    id: 'mushroom_kingdom',
    title: 'Toadstool Castle Sprint',
    bpm: 140,
    leadWave: 'square',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'pop',
    leadVol: 0.13,
    bassVol: 0.16,
    arpVol: 0.08,
    drumVol: 0.14,
    melody: [
      E5, E5, _, E5, _, C5, E5, _, G5, _, _, _, G4, _, _, _,
      C5, _, _, G4, _, E4, _, A4, _, B4, _, As4, A4, _, G4, _,
    ],
    bass: [
      C3, C3, _, C3, _, G2, C3, _, G2, _, _, _, G2, _, _, _,
      C3, _, _, G2, _, C2, _, F2, _, G2, _, Fs2, F2, _, G2, _,
    ],
    chords: [
      [C4, E4, G4], [C4, E4, G4], [G4, B4, D5], [G4, B4, D5],
      [C4, E4, G4], [C4, E4, G4], [F4, A4, C5], [G4, B4, D5],
    ],
  },

  rainbow_road: {
    id: 'rainbow_road',
    title: 'Starlight Prism Hyperdrive',
    bpm: 154,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    arpWave: 'triangle',
    drumStyle: 'trance',
    leadVol: 0.13,
    bassVol: 0.14,
    arpVol: 0.10,
    drumVol: 0.15,
    melody: [
      A5, _, E5, A5, B5, _, C6, _, B5, _, G5, _, E5, _, _, _,
      F5, _, G5, A5, G5, _, E5, _, D5, E5, F5, G5, A5, _, _, _,
    ],
    bass: [
      A2, A3, A2, A3, A2, A3, G2, _, G2, G3, G2, G3, E2, E3, E2, _,
      F2, F3, F2, F3, C2, C3, C2, _, D2, D3, E2, E3, A2, A3, A2, _,
    ],
    chords: [
      [A4, C5, E5], [A4, C5, E5], [G4, B4, D5], [E4, G4, B4],
      [F4, A4, C5], [C4, E4, G4], [D4, F4, A4], [A4, C5, E5],
    ],
  },

  sunshine_airport: {
    id: 'sunshine_airport',
    title: 'Terminal Runway Jazz',
    bpm: 136,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'jazz',
    leadVol: 0.15,
    bassVol: 0.16,
    arpVol: 0.08,
    drumVol: 0.13,
    melody: [
      E5, _, G5, A5, _, G5, E5, D5, C5, _, D5, E5, _, _, _, _,
      F5, _, A5, C6, _, A5, G5, _, E5, D5, C5, E5, D5, _, C5, _,
    ],
    bass: [
      C3, _, E3, _, G2, _, B2, _, A2, _, E2, _, A2, _, G2, _,
      F2, _, C3, _, G2, _, D3, _, C3, _, G2, _, C3, _, G2, _,
    ],
    chords: [
      [C4, E4, G4, B4], [G4, B4, D5], [A4, C5, E5, G5], [A4, C5, E5],
      [F4, A4, C5, E5], [G4, B4, D5, F5], [C4, E4, G4, B4], [G4, B4, D5],
    ],
  },

  dino_dino_jungle: {
    id: 'dino_dino_jungle',
    title: 'Primal Canopy Stampede',
    bpm: 138,
    leadWave: 'triangle',
    bassWave: 'sawtooth',
    arpWave: 'triangle',
    drumStyle: 'latin',
    leadVol: 0.16,
    bassVol: 0.14,
    arpVol: 0.07,
    drumVol: 0.16,
    melody: [
      C5, _, D5, F5, G5, _, F5, D5, C5, _, As4, _, C5, _, _, _,
      G5, _, As5, G5, F5, _, D5, _, C5, D5, F5, D5, C5, _, _, _,
    ],
    bass: [
      C2, _, G2, C3, C2, _, G2, _, As2, _, F2, _, C3, _, G2, _,
      G2, _, D3, _, F2, _, C3, _, C2, _, G2, _, C3, _, _, _,
    ],
    chords: [
      [C4, F4, G4], [C4, F4, G4], [As4, D5, F5], [C4, F4, G4],
      [G4, As4, D5], [F4, A4, C5], [C4, F4, G4], [C4, F4, G4],
    ],
  },

  great_block_ruins: {
    id: 'great_block_ruins',
    title: 'Monolith Temple Echo',
    bpm: 126,
    leadWave: 'sine',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'march',
    leadVol: 0.17,
    bassVol: 0.15,
    arpVol: 0.08,
    drumVol: 0.14,
    melody: [
      E4, _, B4, _, D5, _, B4, _, A4, _, G4, Fs4, E4, _, _, _,
      G4, _, A4, B4, D5, _, E5, _, D5, _, B4, A4, E4, _, _, _,
    ],
    bass: [
      E2, _, B2, _, E2, _, B2, _, D2, _, A2, _, E2, _, B2, _,
      G2, _, D3, _, B2, _, Fs2, _, D2, _, A2, _, E2, _, _, _,
    ],
    chords: [
      [E4, G4, B4], [E4, G4, B4], [D4, Fs4, A4], [E4, G4, B4],
      [G4, B4, D5], [B4, D5, Fs5], [D4, Fs4, A4], [E4, G4, B4],
    ],
  },

  boo_cinema: {
    id: 'boo_cinema',
    title: 'Phantom Matinee Organ',
    bpm: 128,
    leadWave: 'square',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'jazz',
    leadVol: 0.11,
    bassVol: 0.16,
    arpVol: 0.08,
    drumVol: 0.12,
    melody: [
      C5, B4, C5, Ds5, _, D5, C5, B4, C5, _, Gs4, _, G4, _, _, _,
      Ds5, D5, Ds5, G5, _, Fs5, F5, E5, Ds5, D5, C5, B4, C5, _, _, _,
    ],
    bass: [
      C3, _, G2, _, Gs2, _, G2, _, C3, _, Gs2, _, G2, _, D2, _,
      C3, _, G2, _, B2, _, G2, _, Gs2, _, G2, _, C3, _, _, _,
    ],
    chords: [
      [C4, Ds4, G4], [Gs4, C5, Ds5], [C4, Ds4, G4], [G4, B4, D5],
      [C4, Ds4, G4], [G4, B4, D5], [Gs4, C5, Ds5], [C4, Ds4, G4],
    ],
  },

  bowsers_castle: {
    id: 'bowsers_castle',
    title: 'Magma Keep Metal',
    bpm: 150,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    arpWave: 'square',
    drumStyle: 'rock',
    leadVol: 0.13,
    bassVol: 0.15,
    arpVol: 0.07,
    drumVol: 0.17,
    melody: [
      E4, E4, G4, _, E4, F4, Gs4, _, B4, _, A4, G4, F4, _, E4, _,
      E5, _, D5, C5, B4, _, C5, D5, E5, _, B4, Gs4, E4, _, _, _,
    ],
    bass: [
      E2, E2, E2, E2, F2, F2, E2, E2, G2, G2, A2, A2, F2, F2, E2, _,
      E2, E2, D2, D2, C2, C2, B2, B2, E2, E2, B2, Gs2, E2, _, _, _,
    ],
    chords: [
      [E4, G4, B4], [F4, A4, C5], [G4, B4, D5], [E4, Gs4, B4],
      [E4, G4, B4], [C4, E4, G4], [E4, Gs4, B4], [E4, G4, B4],
    ],
  },

  dry_bones_burnout: {
    id: 'dry_bones_burnout',
    title: 'Cinder Spine Riff',
    bpm: 148,
    leadWave: 'sawtooth',
    bassWave: 'square',
    arpWave: 'square',
    drumStyle: 'rock',
    leadVol: 0.13,
    bassVol: 0.13,
    arpVol: 0.06,
    drumVol: 0.16,
    melody: [
      A4, _, C5, D5, Ds5, D5, C5, _, A4, _, G4, A4, C5, _, _, _,
      E5, _, Ds5, D5, C5, _, A4, G4, A4, _, E4, G4, A4, _, _, _,
    ],
    bass: [
      A2, A2, C3, A2, D3, D3, C3, A2, A2, A2, G2, G2, C3, _, G2, _,
      E2, E2, Ds2, Ds2, D2, D2, C2, G2, A2, A2, E2, G2, A2, _, _, _,
    ],
    chords: [
      [A4, C5, E5], [D4, F4, A4], [A4, C5, E5], [C4, E4, G4],
      [E4, G4, B4], [D4, F4, A4], [A4, C5, E5], [A4, C5, E5],
    ],
  },

  toads_factory: {
    id: 'toads_factory',
    title: 'Assembly Line Funk',
    bpm: 136,
    leadWave: 'square',
    bassWave: 'sawtooth',
    arpWave: 'triangle',
    drumStyle: 'funk',
    leadVol: 0.12,
    bassVol: 0.15,
    arpVol: 0.08,
    drumVol: 0.15,
    melody: [
      G4, _, As4, C5, _, Ds5, C5, As4, G4, _, F4, G4, As4, _, _, _,
      D5, _, C5, As4, G4, _, F4, Ds4, F4, _, G4, As4, G4, _, _, _,
    ],
    bass: [
      G2, G3, _, G2, As2, _, C3, _, G2, G3, _, F2, As2, _, F2, _,
      D3, _, C3, _, G2, _, Ds2, _, F2, _, G2, _, G2, _, D3, _,
    ],
    chords: [
      [G4, As4, D5], [C4, Ds4, G4], [G4, As4, D5], [As4, D5, F5],
      [D4, F4, A4], [G4, As4, D5], [F4, A4, C5], [G4, As4, D5],
    ],
  },

  starlight_circuit: {
    id: 'starlight_circuit',
    title: 'Twilight Chicane Pulse',
    bpm: 145,
    leadWave: 'sawtooth',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'trance',
    leadVol: 0.13,
    bassVol: 0.16,
    arpVol: 0.09,
    drumVol: 0.14,
    melody: [
      Fs5, _, Cs5, _, D5, _, E5, _, Fs5, _, A5, _, Gs5, _, E5, _,
      D5, _, E5, Fs5, E5, _, Cs5, _, B4, _, Cs5, D5, Cs5, _, _, _,
    ],
    bass: [
      Fs2, Fs3, Fs2, Fs3, D2, D3, E2, E3, Fs2, Fs3, A2, A3, E2, E3, E2, _,
      D2, D3, D2, D3, A2, A3, A2, _, B2, B3, Cs3, Cs3, Fs2, _, _, _,
    ],
    chords: [
      [Fs4, A4, Cs5], [D4, Fs4, A4], [Fs4, A4, Cs5], [E4, Gs4, B4],
      [D4, Fs4, A4], [A4, Cs5, E5], [B4, D5, Fs5], [Fs4, A4, Cs5],
    ],
  },

  mario_circuit: {
    id: 'mario_circuit',
    title: 'Champion Raceway',
    bpm: 144,
    leadWave: 'square',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'pop',
    leadVol: 0.13,
    bassVol: 0.16,
    arpVol: 0.08,
    drumVol: 0.15,
    melody: [
      G5, _, E5, _, C5, D5, E5, _, F5, A5, G5, F5, E5, _, D5, _,
      G5, _, A5, B5, C6, _, G5, _, E5, D5, C5, D5, C5, _, _, _,
    ],
    bass: [
      C3, _, G2, _, A2, _, E2, _, F2, _, C3, _, G2, _, D3, _,
      E2, _, B2, _, C3, _, G2, _, F2, _, G2, _, C3, _, G2, _,
    ],
    chords: [
      [C4, E4, G4], [A4, C5, E5], [F4, A4, C5], [G4, B4, D5],
      [E4, G4, B4], [C4, E4, G4], [F4, A4, C5], [C4, E4, G4],
    ],
  },

  choco_mountain: {
    id: 'choco_mountain',
    title: 'Cocoa Canyon Stomp',
    bpm: 134,
    leadWave: 'triangle',
    bassWave: 'sawtooth',
    arpWave: 'triangle',
    drumStyle: 'rock',
    leadVol: 0.15,
    bassVol: 0.14,
    arpVol: 0.07,
    drumVol: 0.14,
    melody: [
      A4, _, Cs5, E5, _, Fs5, E5, Cs5, D5, _, Fs5, _, E5, _, Cs5, _,
      B4, _, D5, Fs5, _, E5, D5, B4, A4, _, E4, G4, A4, _, _, _,
    ],
    bass: [
      A2, _, E3, _, A2, _, Cs3, _, D3, _, A2, _, A2, _, E3, _,
      B2, _, Fs2, _, E2, _, B2, _, A2, _, E2, _, A2, _, _, _,
    ],
    chords: [
      [A4, Cs5, E5], [A4, Cs5, E5], [D4, Fs4, A4], [A4, Cs5, E5],
      [B4, D5, Fs5], [E4, Gs4, B4], [A4, Cs5, E5], [A4, Cs5, E5],
    ],
  },

  acorn_heights: {
    id: 'acorn_heights',
    title: 'Canopy Treetop Jig',
    bpm: 138,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'shanty',
    leadVol: 0.16,
    bassVol: 0.16,
    arpVol: 0.08,
    drumVol: 0.13,
    melody: [
      G4, B4, D5, G5, _, Fs5, E5, D5, E5, G5, Fs5, D5, B4, _, A4, _,
      G4, B4, D5, G5, _, A5, G5, E5, D5, B4, A4, Fs4, G4, _, _, _,
    ],
    bass: [
      G2, _, D3, _, G2, _, B2, _, C3, _, D3, _, G2, _, D3, _,
      G2, _, D3, _, C3, _, E3, _, D3, _, A2, _, G2, _, _, _,
    ],
    chords: [
      [G4, B4, D5], [G4, B4, D5], [C4, E4, G4], [G4, B4, D5],
      [G4, B4, D5], [C4, E4, G4], [D4, Fs4, A4], [G4, B4, D5],
    ],
  },

  cheep_cheep_falls: {
    id: 'cheep_cheep_falls',
    title: 'Cascade River Run',
    bpm: 132,
    leadWave: 'sine',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'pop',
    leadVol: 0.17,
    bassVol: 0.15,
    arpVol: 0.09,
    drumVol: 0.12,
    melody: [
      F5, _, E5, C5, D5, _, C5, A4, As4, _, D5, F5, E5, _, C5, _,
      A5, _, G5, F5, D5, _, F5, G5, A5, _, G5, E5, F5, _, _, _,
    ],
    bass: [
      F2, _, C3, _, D3, _, A2, _, As2, _, F2, _, C3, _, G2, _,
      F2, _, C3, _, As2, _, F2, _, C3, _, G2, _, F2, _, C3, _,
    ],
    chords: [
      [F4, A4, C5], [D4, F4, A4], [As4, D5, F5], [C4, E4, G4],
      [F4, A4, C5], [As4, D5, F5], [C4, E4, G4], [F4, A4, C5],
    ],
  },

  moo_moo_meadows: {
    id: 'moo_moo_meadows',
    title: 'Clover Barn Hoe-Down',
    bpm: 130,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'triangle',
    drumStyle: 'shanty',
    leadVol: 0.16,
    bassVol: 0.16,
    arpVol: 0.08,
    drumVol: 0.12,
    melody: [
      C5, D5, E5, G5, _, E5, D5, C5, D5, E5, F5, D5, E5, _, C5, _,
      A5, _, G5, E5, F5, _, E5, D5, C5, D5, E5, G5, C5, _, _, _,
    ],
    bass: [
      C3, _, G2, _, C3, _, G2, _, G2, _, D3, _, C3, _, G2, _,
      F2, _, C3, _, G2, _, D3, _, C3, _, G2, _, C3, _, _, _,
    ],
    chords: [
      [C4, E4, G4], [C4, E4, G4], [G4, B4, D5], [C4, E4, G4],
      [F4, A4, C5], [G4, B4, D5], [C4, E4, G4], [C4, E4, G4],
    ],
  },

  salty_salty_speedway: {
    id: 'salty_salty_speedway',
    title: 'Grand Canal Mandolin',
    bpm: 136,
    leadWave: 'triangle',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'latin',
    leadVol: 0.16,
    bassVol: 0.15,
    arpVol: 0.09,
    drumVol: 0.12,
    melody: [
      E5, _, G5, B5, _, A5, G5, Fs5, G5, _, E5, _, B4, _, _, _,
      C5, E5, G5, _, Fs5, A5, G5, Fs5, E5, _, B4, Ds5, E5, _, _, _,
    ],
    bass: [
      E2, _, B2, _, B2, _, Fs2, _, E2, _, B2, _, E2, _, B2, _,
      C3, _, G2, _, D3, _, B2, _, E2, _, B2, _, E2, _, _, _,
    ],
    chords: [
      [E4, G4, B4], [B4, Ds5, Fs5], [E4, G4, B4], [E4, G4, B4],
      [C4, E4, G4], [D4, Fs4, A4], [B4, Ds5, Fs5], [E4, G4, B4],
    ],
  },

  dandelion_depths: {
    id: 'dandelion_depths',
    title: 'Crystal Grotto Drift',
    bpm: 126,
    leadWave: 'sine',
    bassWave: 'triangle',
    arpWave: 'sine',
    drumStyle: 'trance',
    leadVol: 0.17,
    bassVol: 0.15,
    arpVol: 0.09,
    drumVol: 0.11,
    melody: [
      D5, _, A5, _, F5, _, G5, _, E5, _, C5, _, A4, _, _, _,
      As4, _, D5, F5, E5, _, G5, _, F5, _, E5, Cs5, D5, _, _, _,
    ],
    bass: [
      D2, _, A2, _, F2, _, C3, _, C2, _, G2, _, A2, _, E2, _,
      As2, _, F2, _, C3, _, G2, _, A2, _, E2, _, D2, _, _, _,
    ],
    chords: [
      [D4, F4, A4], [F4, A4, C5], [C4, E4, G4], [A4, Cs5, E5],
      [As4, D5, F5], [C4, E4, G4], [A4, Cs5, E5], [D4, F4, A4],
    ],
  },

  bung_stadium: {
    id: 'bung_stadium',
    title: 'Bung Stadium Thunder',
    bpm: 154,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    arpWave: 'square',
    drumStyle: 'rock',
    leadVol: 0.14,
    bassVol: 0.16,
    arpVol: 0.06,
    drumVol: 0.16,
    melody: [
      E5, _, E5, G5, A5, _, G5, E5, D5, _, D5, E5, G5, _, _, _,
      E5, _, G5, A5, B5, _, A5, G5, A5, _, G5, E5, E5, _, _, _,
    ],
    bass: [
      E2, E2, E3, E2, E2, E2, G2, A2, D2, D2, D3, D2, G2, G2, B2, G2,
      C2, C2, C3, C2, D2, D2, D3, D2, E2, E2, B2, E2, E2, E2, _, _,
    ],
    chords: [
      [E4, G4, B4], [E4, G4, B4], [D4, Fs4, A4], [G4, B4, D5],
      [C4, E4, G4], [D4, Fs4, A4], [E4, G4, B4], [E4, G4, B4],
    ],
  },
};

export function getMapSongSpec(id: MusicTrackId): MapSongSpec {
  return MAP_SONGS[id] ?? MAP_SONGS.mario_bros_circuit;
}
