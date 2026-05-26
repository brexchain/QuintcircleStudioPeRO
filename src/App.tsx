/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  Guitar,
  BookOpen,
  Mic,
  Music,
  Sliders,
  Waves,
  Drum,
  Volume2,
  Play,
  Square,
  Trash2,
  Minus,
  Plus,
  SlidersHorizontal,
  Copy,
  Share2,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Notes and circular indices
const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const CO5 = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
const CO5_MAJ = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const CO5_MIN = ["Am", "Em", "Bm", "F#m", "C#m", "G#m", "D#m", "Bbm", "Fm", "Cm", "Gm", "Dm"];
const SHARP_KEYS = new Set([0, 7, 2, 9, 4, 11, 6]);

function noteNameAny(semi: number, key: number = 0): string {
  return SHARP_KEYS.has(key) ? SHARP[semi] : FLAT[semi];
}

// Timeline item interface
interface TimelineItem {
  type: "chord" | "label";
  name: string;
  semitone?: number;
  quality?: "maj" | "min" | "dim";
  suffix?: string;
  roman?: string;
  id: number;
}

// Theoretical progressions DB
// Theoretical progressions DB with explicit categories
const PROG_DB = [
  {
    id: "pop",
    name: "Pop-Standard",
    category: "classic",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 9, q: "min" as const, r: "vi" },
      { s: 5, q: "maj" as const, r: "IV" }
    ],
    songs: [
      "Let It Be — Beatles",
      "Someone Like You — Adele",
      "Auf Uns — Bourani",
      "No Woman No Cry — Bob Marley",
      "Don't Stop Believin' — Journey"
    ],
    desc: "Die meistgenutzte Pop-Akkordfolge überhaupt."
  },
  {
    id: "rock",
    name: "Rock'n'Roll & Blues",
    category: "classic",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 0, q: "maj" as const, r: "I" }
    ],
    songs: ["Twist and Shout — Beatles", "La Bamba — Valens", "Johnny B. Goode — Berry", "Hound Dog — Elvis"],
    desc: "Der klassische, energiegeladene 3-Akkord-Rock."
  },
  {
    id: "melo",
    name: "Melancholie",
    category: "classic",
    chords: [
      { s: 9, q: "min" as const, r: "vi" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 7, q: "maj" as const, r: "V" }
    ],
    songs: ["Zombie — Cranberries", "All of Me — John Legend", "Skyfall — Adele", "Despacito — Luis Fonsi"],
    desc: "Beginnt in der Paralleltonart (Moll) für emotionale Tiefe."
  },
  {
    id: "doo",
    name: "50er Doo-Wop",
    category: "classic",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 9, q: "min" as const, r: "vi" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 7, q: "maj" as const, r: "V" }
    ],
    songs: ["Stand By Me — Ben E. King", "Every Breath You Take — Police", "Blue Moon — Elvis"],
    desc: "Der ikonische Sound der goldenen 50er Jahre."
  },
  {
    id: "sehn",
    name: "Sehnsucht (Acoustic Rock)",
    category: "classic",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 9, q: "min" as const, r: "vi" },
      { s: 7, q: "maj" as const, r: "V" }
    ],
    songs: ["With or Without You — U2", "Marry You — Bruno Mars", "Cryin' — Aerosmith"],
    desc: "Ein treibender, zyklischer Spannungsbogen."
  },
  {
    id: "andal",
    name: "Andalusische Kadenz",
    category: "classic",
    chords: [
      { s: 9, q: "min" as const, r: "i" },
      { s: 7, q: "maj" as const, r: "VII" },
      { s: 5, q: "maj" as const, r: "VI" },
      { s: 4, q: "maj" as const, r: "V" }
    ],
    songs: ["Hit the Road Jack — Ray Charles", "Sultans of Swing — Dire Straits", "Stairway to Heaven (Teil)"],
    desc: "Aus der traditionellen spanischen Musik und Flamenco."
  },
  {
    id: "pach",
    name: "Pachelbels Kanon",
    category: "classic",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 9, q: "min" as const, r: "vi" },
      { s: 4, q: "min" as const, r: "iii" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 7, q: "maj" as const, r: "V" }
    ],
    songs: ["Canon in D — Pachelbel", "Basket Case — Green Day", "Memories — Maroon 5"],
    desc: "Barocke Perfektion, die die zeitgenössische Musik prägt."
  },
  {
    id: "plagal",
    name: "Kirche & Plagal (Satie Style)",
    category: "classic",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" }
    ],
    songs: ["Imagine — John Lennon", "Gymnopédie No.1 — Erik Satie", "In My Life — Beatles"],
    desc: "Ein meditativer Pendelschlag zwischen Tonika (I) und Subdominante (IV)."
  },
  {
    id: "blues_12",
    name: "12-Takt Blues Schema",
    category: "classic",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 7, q: "maj" as const, r: "V" }
    ],
    songs: ["Sweet Home Chicago — Robert Johnson", "Pride and Joy — SRV", "Rock Around the Clock"],
    desc: "Das fundamentale 12-Takt-Formular aller Blues- und Jam-Klassiker."
  },
  {
    id: "royal_road",
    name: "Royal Road (Epic J-Pop)",
    category: "classic",
    chords: [
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 4, q: "min" as const, r: "iii" },
      { s: 9, q: "min" as const, r: "vi" }
    ],
    songs: ["Unzählige Anime-Openings", "Fly Me To The Moon (Modifiziert)", "Never Gonna Give You Up"],
    desc: "Die beliebteste Kadenz asiatischer Musik für epische, vorwärtsstrebende Melodien."
  },
  {
    id: "neo_soul",
    name: "Neo-Soul / Jazz Turnaround",
    category: "classic",
    chords: [
      { s: 2, q: "min" as const, r: "ii" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" }
    ],
    songs: ["Sunday Morning — Maroon 5", "Don't Know Why — Norah Jones", "Just the Two of Us (Teil)"],
    desc: "Ein butterweiches Jazz-Pattern (ii - V - I - IV) voller Eleganz und Groove."
  },
  // Famous Song Riffs starting here
  {
    id: "smoke_riff",
    name: "Smoke on the Water (Riff)",
    category: "riff",
    chords: [
      { s: 0, q: "min" as const, r: "i" },
      { s: 3, q: "maj" as const, r: "bIII" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "min" as const, r: "i" },
      { s: 3, q: "maj" as const, r: "bIII" },
      { s: 6, q: "dim" as const, r: "bV" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "min" as const, r: "i" },
      { s: 3, q: "maj" as const, r: "bIII" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 3, q: "maj" as const, r: "bIII" },
      { s: 0, q: "min" as const, r: "i" }
    ],
    songs: ["Smoke on the Water — Deep Purple"],
    desc: "Das ikonischste Riff der Gitarrengeschichte als vollständige, perfekt aufgelöste 12-taktige Akkordfolge."
  },
  {
    id: "hotel_cali",
    name: "Hotel California (Verse)",
    category: "riff",
    chords: [
      { s: 9, q: "min" as const, r: "vi" },
      { s: 4, q: "maj" as const, r: "III" },
      { s: 7, q: "maj" as const, r: "VII" },
      { s: 2, q: "maj" as const, r: "II" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 2, q: "min" as const, r: "ii" },
      { s: 4, q: "maj" as const, r: "III" }
    ],
    songs: ["Hotel California — Eagles"],
    desc: "Der legendäre, melancholische Akkord-Kreis mit absteigender Quinten-Struktur."
  },
  {
    id: "wonderwall",
    name: "Wonderwall Acoustic",
    category: "riff",
    chords: [
      { s: 4, q: "min" as const, r: "iii" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 2, q: "maj" as const, r: "II" },
      { s: 9, q: "maj" as const, r: "VI" }
    ],
    songs: ["Wonderwall — Oasis", "Boulevard of Broken Dreams (Teil)"],
    desc: "Das ultimative Akustik-Gitarren-Lagerfeuer-Riff mit schwebendem Charakter."
  },
  {
    id: "creep_climb",
    name: "Creep (Modaler Wechsel)",
    category: "riff",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 4, q: "maj" as const, r: "III" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 5, q: "min" as const, r: "iv" }
    ],
    songs: ["Creep — Radiohead", "Get Free — Lana Del Rey"],
    desc: "Bittersüßer Klang durch den moderen Austausch der Moll-Subdominante (iv)."
  },
  {
    id: "smells_grunge",
    name: "Smells Like Teen Spirit",
    category: "riff",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 3, q: "maj" as const, r: "bIII" },
      { s: 8, q: "maj" as const, r: "bVI" }
    ],
    songs: ["Smells Like Teen Spirit — Nirvana", "More Than a Feeling — Boston"],
    desc: "Das ikonischen Grunge-Vier-Akkord-Riff für dröhnende Gitarrengrooves."
  },
  {
    id: "sweet_child",
    name: "Sweet Child O' Mine",
    category: "riff",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 10, q: "maj" as const, r: "bVII" },
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 0, q: "maj" as const, r: "I" }
    ],
    songs: ["Sweet Child O' Mine — Guns N' Roses"],
    desc: "Treibender, sonniger mixolydischer Sound (I - bVII - IV - I)."
  },
  {
    id: "get_lucky",
    name: "Get Lucky Groove",
    category: "riff",
    chords: [
      { s: 9, q: "min" as const, r: "vi" },
      { s: 0, q: "maj" as const, r: "I" },
      { s: 4, q: "min" as const, r: "iii" },
      { s: 2, q: "maj" as const, r: "II" }
    ],
    songs: ["Get Lucky — Daft Punk", "Attention — Charlie Puth"],
    desc: "Disco/Soul Loop der Extraklasse mit unwiderstehlichem Drang."
  },
  {
    id: "clocks",
    name: "Clocks Loop",
    category: "riff",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 7, q: "min" as const, r: "v" },
      { s: 7, q: "min" as const, r: "v" },
      { s: 2, q: "min" as const, r: "ii" }
    ],
    songs: ["Clocks — Coldplay"],
    desc: "Welliges Arpeggio-Pattern mit markant abfallendem Moll-Dominant-Wechsel."
  },
  {
    id: "let_her_go",
    name: "Let Her Go (Acoustic)",
    category: "riff",
    chords: [
      { s: 5, q: "maj" as const, r: "IV" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 9, q: "min" as const, r: "vi" },
      { s: 7, q: "maj" as const, r: "V" }
    ],
    songs: ["Let Her Go — Passenger", "All of Me (Chorus) — John Legend"],
    desc: "Zart voranschreitende Melancholie, die das tonale Zentrum (I) meidet."
  },
  {
    id: "southern_road",
    name: "Southern Rock-Wechsel",
    category: "riff",
    chords: [
      { s: 7, q: "maj" as const, r: "I" },
      { s: 5, q: "maj" as const, r: "bVII" },
      { s: 0, q: "maj" as const, r: "IV" }
    ],
    songs: ["Sweet Home Alabama — Lynyrd Skynyrd", "Fortunate Son — CCR", "Werewolves of London"],
    desc: "Ein herrlich offener Mixolydischer Vibe: I - bVII - IV (in Key G: D - C - G)."
  }
];

// iOS Styled Selector Options
const DRUM_OPTIONS = [
  { id: "standard", label: "Metronom", icon: "⏱️" },
  { id: "rock", label: "Classic Rock", icon: "🥁" },
  { id: "funk", label: "Funk", icon: "🕺" },
  { id: "trap", label: "Trap Drill", icon: "🔥" },
  { id: "latin", label: "Bossa", icon: "🌴" }
];

const BASS_OPTIONS = [
  { id: "root", label: "Grundton", icon: "🔉" },
  { id: "walk", label: "Walking", icon: "🎷" },
  { id: "octave", label: "Oktaven", icon: "🛸" },
  { id: "syncopated", label: "Synkopen", icon: "⚡" },
  { id: "melodic", label: "Melodisch", icon: "🎨" }
];

const STRUM_OPTIONS = [
  { id: "block", label: "Block", icon: "🎹" },
  { id: "arpeggio", label: "Arp", icon: "✨" },
  { id: "strum", label: "Zupfen", icon: "🪕" }
];

export default function App() {
  const [tab, setTab] = useState<"songwriter" | "theorie" | "tuner">("songwriter");
  const [selKeyIdx, setSelKeyIdx] = useState<number>(0);
  const [capo, setCapo] = useState<number>(0);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [playing, setPlaying] = useState<boolean>(false);
  const [playIdx, setPlayIdx] = useState<number>(-1);
  const [bpm, setBpm] = useState<number>(100);
  const [currentInst, setCurrentInst] = useState<string>("piano");
  const [drumsOn, setDrumsOn] = useState<boolean>(false);
  const [basslineOn, setBasslineOn] = useState<boolean>(false);
  const [beatsPerBar, setBeatsPerBar] = useState<3 | 4>(4);
  const [strumPattern, setStrumPattern] = useState<"block" | "arpeggio" | "strum">("block");
  const [drumPattern, setDrumPattern] = useState<string>("standard");
  const [bassPattern, setBassPattern] = useState<string>("root");
  const [theoryKey, setTheoryKey] = useState<number>(0);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [isFooterMinimized, setIsFooterMinimized] = useState<boolean>(false);

  // Audio nodes and context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const playTimeoutRef = useRef<number | null>(null);
  const timelineRef = useRef<TimelineItem[]>([]);
  const uidRef = useRef<number>(0);

  // Tuner state
  const [isTunerRunning, setIsTunerRunning] = useState<boolean>(false);
  const tunerStreamRef = useRef<MediaStream | null>(null);
  const tunerAnalyserRef = useRef<AnalyserNode | null>(null);
  const tunerRafIdRef = useRef<number | null>(null);
  const [tunerNote, setTunerNote] = useState<string>("-");
  const [tunerCents, setTunerCents] = useState<number>(0);
  const [tunerHz, setTunerHz] = useState<number>(0);
  const [activeGuitarString, setActiveGuitarString] = useState<string | null>(null);

  const selKey = CO5[selKeyIdx];

  // Sync timeline ref with state to avoid timeout stale closure
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Clean playTimeout on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      stopTuner();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.8;
      gainNode.connect(ctx.destination);
      audioContextRef.current = ctx;
      masterGainRef.current = gainNode;
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  const getNoiseBuffer = (): AudioBuffer => {
    if (noiseBufferRef.current) return noiseBufferRef.current;
    const ctx = audioContextRef.current;
    if (!ctx) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = buffer;
    return buffer;
  };

  const chordIntervals = (q: "maj" | "min" | "dim") => {
    return q === "maj" ? [0, 4, 7] : q === "min" ? [0, 3, 7] : [0, 3, 6];
  };

  const playChordInst = (s: number, q: "maj" | "min" | "dim", d: number, pat: string) => {
    initAudio();
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;

    if (currentInst === "guitar") {
      const intervals = chordIntervals(q);
      const baseFreq = 130.81;
      if (pat === "arpeggio") {
        const arp = [...intervals, 12];
        arp.forEach((iv, ni) => {
          const f = baseFreq * Math.pow(2, (s + iv) / 12);
          const dl = ni * 0.12;
          const t = ctx.currentTime + dl;
          [0, 12].forEach((o) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = ni === 0 ? "triangle" : "sawtooth";
            osc.frequency.value = f * Math.pow(2, o / 12);
            const v = 0.045 / (o === 0 ? 1 : 2);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.006);
            g.gain.exponentialRampToValueAtTime(0.0001, t + d);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + d + 0.05);
          });
        });
      } else {
        intervals.forEach((iv, ni) => {
          [0, -12, 12].forEach((o, oi) => {
            const f = baseFreq * Math.pow(2, (s + iv + o) / 12);
            const dl = pat === "strum" ? ni * 0.04 + oi * 0.01 : 0;
            const t = ctx.currentTime + dl;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = ni === 0 ? "triangle" : "sawtooth";
            osc.frequency.value = f;
            const v = 0.055 / (oi + 1);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.006);
            g.gain.exponentialRampToValueAtTime(Math.max(v * 0.25, 0.0001), t + 0.45);
            g.gain.exponentialRampToValueAtTime(0.0001, t + d);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + d + 0.05);
          });
        });
      }
    } else if (currentInst === "piano") {
      const intervals = chordIntervals(q);
      const baseFreq = 261.63;
      const harmonics = [1, 0.5, 0.3, 0.15];
      intervals.forEach((iv, ni) => {
        [0, -12].forEach((o, oi) => {
          const f = baseFreq * Math.pow(2, (s + iv + o) / 12);
          const dl = pat === "arpeggio" ? ni * 0.1 : 0;
          const t = ctx.currentTime + dl;
          harmonics.forEach((a, hi) => {
            const hf = f * (hi + 1);
            if (hf > 8000) return;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = hf;
            const v = (a * 0.06) / (oi + 1);
            const dc = Math.max(0.3, d * (1 - hi * 0.12));
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dc);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + dc + 0.05);
          });
        });
      });
    } else if (currentInst === "ukulele") {
      const intervals = chordIntervals(q);
      const baseFreq = 261.63;
      intervals.forEach((iv, ni) => {
        [0, 12].forEach((o, oi) => {
          const f = baseFreq * Math.pow(2, (s + iv + o) / 12);
          const dl = pat === "arpeggio" ? ni * 0.1 : 0;
          const t = ctx.currentTime + dl;
          [1, 2].forEach((h, hi) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = f * h;
            const v = (hi === 0 ? 0.06 : 0.02) / (oi + 1);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, t + d);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + d + 0.05);
          });
        });
      });
    } else if (currentInst === "strings") {
      const intervals = chordIntervals(q);
      const baseFreq = 261.63;
      intervals.forEach((iv, ni) => {
        [0, -12].forEach((o, oi) => {
          const f = baseFreq * Math.pow(2, (s + iv + o) / 12);
          const t = ctx.currentTime;
          [-5, 5].forEach((dt) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const fl = ctx.createBiquadFilter();
            osc.type = "sawtooth";
            osc.frequency.value = f;
            osc.detune.value = dt;
            fl.type = "lowpass";
            fl.frequency.value = f * 2;
            const v = 0.025 / (oi + 1);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.25);
            g.gain.setValueAtTime(v, t + d - 0.35);
            g.gain.linearRampToValueAtTime(0, t + d);
            osc.connect(fl);
            fl.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + d + 0.05);
          });
        });
      });
    } else if (currentInst === "synth") {
      const intervals = chordIntervals(q);
      const baseFreq = 261.63;
      intervals.forEach((iv, ni) => {
        [0, -12].forEach((o, oi) => {
          const f = baseFreq * Math.pow(2, (s + iv + o) / 12);
          const t = ctx.currentTime;
          [-4, 4].forEach((dt) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const fl = ctx.createBiquadFilter();
            osc.type = "sawtooth";
            osc.frequency.value = f;
            osc.detune.value = dt;
            fl.type = "lowpass";
            fl.frequency.value = f * 4;
            fl.Q.value = 1;
            const v = 0.03 / (oi + 1);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.3);
            g.gain.setValueAtTime(v, t + d - 0.4);
            g.gain.linearRampToValueAtTime(0, t + d);
            osc.connect(fl);
            fl.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + d + 0.05);
          });
        });
      });
    } else if (currentInst === "bass") {
      const ints = [0, q === "dim" ? 6 : 7];
      const baseFreq = 55;
      ints.forEach((iv, ni) => {
        const f = baseFreq * Math.pow(2, (s + iv) / 12);
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const fl = ctx.createBiquadFilter();
        osc.type = "sawtooth";
        osc.frequency.value = f;
        fl.type = "lowpass";
        fl.frequency.value = 500;
        const v = ni === 0 ? 0.14 : 0.07;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        osc.connect(fl);
        fl.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + d + 0.05);

        if (ni === 0) {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.type = "sine";
          o2.frequency.value = f;
          g2.gain.setValueAtTime(0, t);
          g2.gain.linearRampToValueAtTime(0.1, t + 0.008);
          g2.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o2.connect(g2);
          g2.connect(masterGain);
          o2.start(t);
          o2.stop(t + d + 0.05);
        }
      });
    }
  };

  const playKick = (time: number) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.08);
    g.gain.setValueAtTime(0.55, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.3);
  };

  const playSnare = (time: number) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer();
    const ng = ctx.createGain();
    const nf = ctx.createBiquadFilter();
    nf.type = "highpass";
    nf.frequency.value = 1200;
    ng.gain.setValueAtTime(0.28, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    ns.connect(nf);
    nf.connect(ng);
    ng.connect(masterGain);
    ns.start(time);
    ns.stop(time + 0.18);

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 180;
    g.gain.setValueAtTime(0.2, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    o.connect(g);
    g.connect(masterGain);
    o.start(time);
    o.stop(time + 0.08);
  };

  const playHihat = (time: number, open = false) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const d = open ? 0.12 : 0.06;
    g.gain.setValueAtTime(open ? 0.1 : 0.07, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + d);
    ns.connect(f);
    f.connect(g);
    g.connect(masterGain);
    ns.start(time);
    ns.stop(time + d);
  };

  const playChuck = (time: number) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1500;
    f.Q.value = 1;
    g.gain.setValueAtTime(0.04, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    ns.connect(f);
    f.connect(g);
    g.connect(masterGain);
    ns.start(time);
    ns.stop(time + 0.04);
  };

  const playBassNote = (semi: number, time: number, dur: number) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const f = 55 * Math.pow(2, semi / 12);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const fl = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.value = f;
    fl.type = "lowpass";
    fl.frequency.value = 350;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.12, time + 0.01);
    g.gain.setValueAtTime(0.12, time + dur - 0.05);
    g.gain.linearRampToValueAtTime(0, time + dur);
    o.connect(fl);
    fl.connect(g);
    g.connect(masterGain);
    o.start(time);
    o.stop(time + dur + 0.01);

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.value = f;
    g2.gain.setValueAtTime(0, time);
    g2.gain.linearRampToValueAtTime(0.08, time + 0.01);
    g2.gain.setValueAtTime(0.08, time + dur - 0.05);
    g2.gain.linearRampToValueAtTime(0, time + dur);
    o2.connect(g2);
    g2.connect(masterGain);
    o2.start(time);
    o2.stop(time + dur + 0.01);
  };

  const scheduleDrumPattern = (startTime: number, barDur: number) => {
    const beat = barDur / beatsPerBar;
    if (drumPattern === "standard") {
      if (beatsPerBar === 4) {
        playKick(startTime);
        playKick(startTime + beat * 2);
        playSnare(startTime + beat);
        playSnare(startTime + beat * 3);
        for (let i = 0; i < 8; i++) playHihat(startTime + (beat / 2) * i, i === 7);
      } else {
        playKick(startTime);
        playSnare(startTime + beat);
        playSnare(startTime + beat * 2);
        for (let i = 0; i < 6; i++) playHihat(startTime + (beat / 2) * i, i === 5);
      }
    } else if (drumPattern === "rock") {
      playKick(startTime);
      playKick(startTime + beat * 2);
      playSnare(startTime + beat);
      playSnare(startTime + beat * 3);
      for (let i = 0; i < 4; i++) {
        playHihat(startTime + beat * i, false);
        if (i < 3) playHihat(startTime + beat * i + beat / 2, true);
      }
    } else if (drumPattern === "funk") {
      playKick(startTime);
      playKick(startTime + beat * 1.5);
      playSnare(startTime + beat * 1);
      playSnare(startTime + beat * 3);
      playHihat(startTime, false);
      playHihat(startTime + beat * 0.25, true);
      playHihat(startTime + beat * 0.75, true);
      playHihat(startTime + beat * 1.25, true);
      playHihat(startTime + beat * 1.75, true);
      playHihat(startTime + beat * 2.25, true);
      playHihat(startTime + beat * 2.75, true);
      playHihat(startTime + beat * 3.25, true);
    } else if (drumPattern === "trap") {
      playKick(startTime);
      playKick(startTime + beat * 0.75);
      playKick(startTime + beat * 1.75);
      playKick(startTime + beat * 2.5);
      playSnare(startTime + beat * 1);
      playSnare(startTime + beat * 3);
      for (let i = 0; i < 16; i++) {
        if (i % 2 === 0) playHihat(startTime + (beat / 4) * i, i % 4 === 3);
      }
    } else if (drumPattern === "latin") {
      playKick(startTime);
      playSnare(startTime + beat * 1.5);
      playSnare(startTime + beat * 3);
      for (let i = 0; i < beatsPerBar * 2; i++) {
        if (i % 2 === 0) playHihat(startTime + (beat / 2) * i, i % 3 === 0);
      }
    }
  };

  const scheduleBassPattern = (rootSemi: number, quality: "maj" | "min" | "dim", startTime: number, barDur: number) => {
    const intervals = chordIntervals(quality);
    const third = intervals[1];
    const fifth = intervals[2];
    const beat = barDur / beatsPerBar;
    if (bassPattern === "root") {
      playBassNote(rootSemi, startTime, beat * 0.9);
    } else if (bassPattern === "walk") {
      playBassNote(rootSemi, startTime, beat * 0.8);
      playBassNote((rootSemi + third) % 12, startTime + beat * 1.2, beat * 0.8);
      playBassNote((rootSemi + fifth) % 12, startTime + beat * 2.4, beat * 0.8);
    } else if (bassPattern === "octave") {
      playBassNote(rootSemi, startTime, beat * 0.8);
      playBassNote((rootSemi + 12) % 12, startTime + beat * 1, beat * 0.9);
      playBassNote((rootSemi + fifth) % 12, startTime + beat * 2, beat * 0.8);
      playBassNote((rootSemi + 12) % 12, startTime + beat * 3, beat * 0.9);
    } else if (bassPattern === "syncopated") {
      playBassNote(rootSemi, startTime, beat * 0.6);
      playBassNote(fifth, startTime + beat * 0.8, beat * 0.4);
      playBassNote(rootSemi, startTime + beat * 1.5, beat * 0.6);
      playBassNote(third, startTime + beat * 2.2, beat * 0.5);
      playBassNote(rootSemi, startTime + beat * 3, beat * 0.8);
    } else if (bassPattern === "melodic") {
      playBassNote(rootSemi, startTime, beat * 0.7);
      playBassNote((rootSemi + 2) % 12, startTime + beat * 1, beat * 0.5);
      playBassNote((rootSemi + third) % 12, startTime + beat * 1.8, beat * 0.6);
      playBassNote((rootSemi + fifth) % 12, startTime + beat * 2.6, beat * 0.7);
    }
  };

  // Diatonic Chords generator
  const getDiatonicChords = (key: number) => {
    const ints = [0, 2, 4, 5, 7, 9, 11];
    const quals = ["maj", "min", "min", "maj", "maj", "min", "dim"] as const;
    const sfx = ["", "m", "m", "", "", "m", "dim"];
    const rom = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
    const desc = ["Haupttonart", "Subdominant-Parallele", "Dominant-Parallele", "Subdominante", "Dominante", "Paralleltonart", "Leitton"];
    return ints.map((iv, i) => {
      const r = (key + iv) % 12;
      return {
        semitone: r,
        name: noteNameAny(r, key) + sfx[i],
        quality: quals[i],
        suffix: sfx[i],
        roman: rom[i],
        desc: desc[i]
      };
    });
  };

  const capoName = (semi: number, suffix: string) => {
    if (capo === 0) return noteNameAny(semi, selKey) + suffix;
    const displaySemi = (semi - capo + 12) % 12;
    return noteNameAny(displaySemi, selKey) + suffix;
  };

  const addChordToTimeline = (name: string, semitone: number, quality: "maj" | "min" | "dim") => {
    initAudio();
    const dia = getDiatonicChords(selKey);
    const match = dia.find((c) => c.semitone === semitone && c.quality === quality);
    const suffix = match ? match.suffix : quality === "min" ? "m" : quality === "dim" ? "dim" : "";
    const roman = match ? match.roman : "";

    const newItem: TimelineItem = {
      type: "chord",
      name,
      semitone,
      quality,
      suffix,
      roman,
      id: uidRef.current++
    };

    setTimeline((prev) => [...prev, newItem]);
    playChordInst(semitone, quality, 0.7, strumPattern);
  };

  const addLabelToTimeline = (labelName: string) => {
    const newItem: TimelineItem = {
      type: "label",
      name: labelName,
      id: uidRef.current++
    };
    setTimeline((prev) => [...prev, newItem]);
  };

  const removeTimelineItem = (id: number) => {
    setTimeline((prev) => prev.filter((item) => item.id !== id));
  };

  const moveTimelineItem = (id: number, dir: -1 | 1) => {
    setTimeline((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[j];
      copy[j] = temp;
      return copy;
    });
  };

  const clearTimeline = () => {
    stopPlay();
    setTimeline([]);
  };

  const transposeTimeline = (amount: number) => {
    setTimeline((prev) =>
      prev.map((item) => {
        if (item.type === "label" || item.semitone === undefined) return item;
        const newSemi = (item.semitone + amount + 12) % 12;
        return {
          ...item,
          semitone: newSemi,
          name: noteNameAny(newSemi, selKey) + (item.suffix || "")
        };
      })
    );
    showToast(amount > 0 ? "+1 Halbton" : "-1 Halbton");
  };

  const generateExportText = () => {
    const currentTimeline = timelineRef.current;
    if (!currentTimeline.length) return "";
    const keyName = CO5_MAJ[selKeyIdx] + " / " + CO5_MIN[selKeyIdx];
    const capoText = capo > 0 ? `\n🧢 Capo: Fret ${capo}` : "";
    let parts: string[] = [];
    let currentPart = "";

    currentTimeline.forEach((ch) => {
      if (ch.type === "label") {
        if (currentPart) parts.push(currentPart);
        currentPart = `\n[${ch.name}]\n`;
      } else {
        const nameText = capoName(ch.semitone ?? 0, ch.suffix ?? "");
        currentPart += (currentPart.endsWith("\n") || currentPart === "" ? "" : " → ") + nameText + (ch.roman ? ` (${ch.roman})` : "");
      }
    });
    if (currentPart) parts.push(currentPart);

    return `🎸 *ChordWood Progression*\n━━━━━━━━━━━━━━━\n🎵 Tonart: ${keyName}${capoText}\n⏱ BPM: ${bpm} | ⏰ ${beatsPerBar}/4 | 🪕 ${strumPattern}\n━━━━━━━━━━━━━━━\n${parts.join("\n")}\n━━━━━━━━━━━━━━━\n🤘 Viel Spaß beim Songwriting!`;
  };

  const copyProgression = () => {
    const text = generateExportText();
    if (!text) {
      showToast("Die Timeline ist leer");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Akkordfolge kopiert!"))
      .catch(() => showToast("Kopieren fehlgeschlagen"));
  };

  const shareWhatsApp = () => {
    const text = generateExportText();
    if (!text) {
      showToast("Die Timeline ist leer");
      return;
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  };

  // Playback Loop Engine
  const startPlay = () => {
    const currentTimeline = timelineRef.current;
    if (!currentTimeline.filter((c) => c.type === "chord").length) {
      showToast("Füge erst Akkorde zur Timeline hinzu");
      return;
    }
    initAudio();
    setPlaying(true);
    setPlayIdx(0);
  };

  const stopPlay = () => {
    setPlaying(false);
    setPlayIdx(-1);
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!playing) return;

    const currentTimeline = timelineRef.current;
    if (playIdx < 0 || playIdx >= currentTimeline.length) {
      setPlayIdx(0);
      return;
    }

    const item = currentTimeline[playIdx];
    const beatDur = 60 / bpm;
    const barDur = beatDur * beatsPerBar;
    const now = audioContextRef.current?.currentTime ?? 0;

    if (item.type === "label") {
      playTimeoutRef.current = setTimeout(() => {
        setPlayIdx((prev) => (prev + 1) >= currentTimeline.length ? 0 : prev + 1);
      }, 300) as any;
      return;
    }

    // Play Chord
    if (item.semitone !== undefined && item.quality) {
      playChordInst(item.semitone, item.quality, barDur * 0.85, strumPattern);
      if (basslineOn) scheduleBassPattern(item.semitone, item.quality, now, barDur);
      if (drumsOn) scheduleDrumPattern(now, barDur);
      if (strumPattern === "strum") {
        for (let b = 0; b < beatsPerBar; b++) {
          playChuck(now + beatDur * (b + 0.5));
        }
      }
    }

    playTimeoutRef.current = setTimeout(() => {
      setPlayIdx((prev) => (prev + 1) >= currentTimeline.length ? 0 : prev + 1);
    }, barDur * 1000) as any;
  }, [playing, playIdx]);

  // Load Progression Template
  const loadProg = (id: string, selectKeyVal?: number) => {
    const p = PROG_DB.find((x) => x.id === id);
    if (!p) return;

    const keyToUse = selectKeyVal !== undefined ? selectKeyVal : selKey;
    if (selectKeyVal !== undefined) {
      setSelKeyIdx(CO5.indexOf(selectKeyVal));
    }

    clearTimeline();
    const newChords = p.chords.map((c) => {
      const semi = (keyToUse + c.s) % 12;
      const sfx = c.q === "min" ? "m" : (c.q as string) === "dim" ? "dim" : "";
      return {
        type: "chord" as const,
        name: noteNameAny(semi, keyToUse) + sfx,
        semitone: semi,
        quality: c.q,
        suffix: sfx,
        roman: c.r,
        id: uidRef.current++
      };
    });
    setTimeline(newChords);
    setTab("songwriter");
    showToast(`${p.name} geladen!`);
  };

  // Append Progression Template
  const appendProg = (id: string, selectKeyVal?: number) => {
    const p = PROG_DB.find((x) => x.id === id);
    if (!p) return;

    const keyToUse = selectKeyVal !== undefined ? selectKeyVal : selKey;

    const addedChords = p.chords.map((c) => {
      const semi = (keyToUse + c.s) % 12;
      const sfx = c.q === "min" ? "m" : (c.q as string) === "dim" ? "dim" : "";
      return {
        type: "chord" as const,
        name: noteNameAny(semi, keyToUse) + sfx,
        semitone: semi,
        quality: c.q,
        suffix: sfx,
        roman: c.r,
        id: uidRef.current++
      };
    });
    setTimeline((prev) => [...prev, ...addedChords]);
    showToast(`${p.name} an Timeline angehängt!`);
  };

  // YIN Pitch Detection Algorithm for Tuner
  const yinPitchDetect = (buf: Float32Array, sr: number) => {
    const SZ = buf.length;
    const half = Math.floor(SZ / 2);
    const yb = new Float32Array(half);
    let rms = 0;
    for (let i = 0; i < SZ; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SZ);
    if (rms < 0.015) return -1;

    for (let t = 0; t < half; t++) {
      yb[t] = 0;
      for (let i = 0; i < half; i++) {
        const d = buf[i] - buf[i + t];
        yb[t] += d * d;
      }
    }
    yb[0] = 1;
    let rs = 0;
    for (let t = 1; t < half; t++) {
      rs += yb[t];
      yb[t] *= t / rs;
    }
    let te = -1;
    for (let t = 2; t < half; t++) {
      if (yb[t] < 0.15) {
        while (t + 1 < half && yb[t + 1] < yb[t]) t++;
        te = t;
        break;
      }
    }
    if (te === -1) return -1;
    let bt;
    const x0 = te < 1 ? te : te - 1;
    const x2 = te + 1 < half ? te + 1 : te;
    if (x0 === te) {
      bt = yb[te] <= yb[x2] ? te : x2;
    } else if (x2 === te) {
      bt = yb[te] <= yb[x0] ? te : x0;
    } else {
      const s0 = yb[x0];
      const s1 = yb[te];
      const s2 = yb[x2];
      bt = te + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
      if (bt < 0) bt = te;
    }
    return sr / bt;
  };

  const startTuner = async () => {
    if (isTunerRunning) {
      stopTuner();
      return;
    }
    initAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      tunerStreamRef.current = stream;
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      tunerAnalyserRef.current = analyser;
      setIsTunerRunning(true);
    } catch (err) {
      showToast("Mikrofonzugriff verweigert oder nicht unterstützt");
    }
  };

  const stopTuner = () => {
    setIsTunerRunning(false);
    if (tunerRafIdRef.current) {
      cancelAnimationFrame(tunerRafIdRef.current);
      tunerRafIdRef.current = null;
    }
    if (tunerStreamRef.current) {
      tunerStreamRef.current.getTracks().forEach((track) => track.stop());
      tunerStreamRef.current = null;
    }
    setTunerNote("-");
    setTunerCents(0);
    setTunerHz(0);
    setActiveGuitarString(null);
  };

  // Run Tuner loop
  useEffect(() => {
    if (!isTunerRunning) return;

    let smoothCents = 0;
    let lastDetected = -1;

    const run = () => {
      const analyser = tunerAnalyserRef.current;
      const ctx = audioContextRef.current;
      if (!analyser || !ctx) return;

      const bufferLength = analyser.fftSize;
      const buffer = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(buffer);

      const freq = yinPitchDetect(buffer, ctx.sampleRate);
      if (freq > 60 && freq < 1200) {
        let nn = 12 * Math.log2(freq / 440) + 69;
        let cn = Math.round(nn);
        let ct = Math.floor(1200 * Math.log2(freq / (440 * Math.pow(2, (cn - 69) / 12))));

        if (ct > 50) {
          cn++;
          ct = Math.floor(1200 * Math.log2(freq / (440 * Math.pow(2, (cn - 69) / 12))));
        }
        if (ct < -50) {
          cn--;
          ct = Math.floor(1200 * Math.log2(freq / (440 * Math.pow(2, (cn - 69) / 12))));
        }

        if (cn !== lastDetected) {
          smoothCents = ct;
          lastDetected = cn;
        } else {
          smoothCents = smoothCents * 0.7 + ct * 0.3;
        }

        const noteIndex = cn % 12;
        setTunerNote(SHARP[noteIndex]);
        setTunerHz(parseFloat(freq.toFixed(1)));
        setTunerCents(Math.round(smoothCents));
      } else {
        setTunerNote("-");
        setTunerHz(0);
        setTunerCents(0);
      }

      tunerRafIdRef.current = requestAnimationFrame(run);
    };

    tunerRafIdRef.current = requestAnimationFrame(run);
    return () => {
      if (tunerRafIdRef.current) cancelAnimationFrame(tunerRafIdRef.current);
    };
  }, [isTunerRunning]);

  const guitarStringsArr = [
    { name: "E2", freq: 82.41, label: "E" },
    { name: "A2", freq: 110.0, label: "A" },
    { name: "D3", freq: 146.83, label: "D" },
    { name: "G3", freq: 196.0, label: "G" },
    { name: "B3", freq: 246.94, label: "B" },
    { name: "E4", freq: 329.63, label: "e" }
  ];

  const handleStringClick = (stringNote: string) => {
    setActiveGuitarString(stringNote);
    initAudio();
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;

    const stringData = guitarStringsArr.find((s) => s.name === stringNote);
    if (!stringData) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(stringData.freq, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, t);

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

    osc.connect(filter);
    filter.connect(g);
    g.connect(masterGain);

    osc.start(t);
    osc.stop(t + 1.9);

    setTimeout(() => {
      setActiveGuitarString(null);
    }, 1800);
  };

  const changeTab = (newTab: "songwriter" | "theorie" | "tuner") => {
    if (newTab !== "tuner") {
      stopTuner();
    }
    setTab(newTab);
  };

  return (
    <div className="bg-[#1a1008] text-[#f0e0cc] min-h-screen font-sans relative overflow-x-hidden pb-96">
      {/* Immersive background fretboard simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-[550px] h-full bg-gradient-to-r from-[#140b04] via-[#221308] to-[#140b04] border-x-4 border-[#3d2b1a] shadow-inner opacity-75">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4c4a8]/50 to-transparent shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              style={{ top: `${10 * i + 5}%` }}
            />
          ))}
          {/* Fretboard markers */}
          {[15, 35, 55, 75].map((top, i) => (
            <div
              key={i}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#f0e0cc] to-[#a89880] opacity-40 shadow-inner"
              style={{ top: `${top}%` }}
            />
          ))}
        </div>
      </div>

      {/* Main Content App Shell */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-[#4a3828]/40 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight text-[#d4943c] font-serif pr-2">
              QuintcircleStudioPeRO
            </h1>
            <p className="text-xs text-[#7a6a58] font-mono tracking-wider uppercase mt-1">
              Songwriter's Toolkit & Circle of Fifths
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setInfoModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2a1e10] border border-[#4a3828] text-[#c8b8a4] hover:border-[#d4943c] hover:text-[#f0e0cc] transition-all cursor-pointer"
            >
              <HelpCircle size={14} /> Guide
            </button>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex justify-center mb-10">
          <div className="relative flex rounded-2xl bg-[#120a04]/90 p-1 border border-[#4a3828]/60 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md select-none">
            {[
              { id: "songwriter" as const, label: "Songwriter", icon: <Guitar size={15} /> },
              { id: "theorie" as const, label: "Theorie", icon: <BookOpen size={15} /> },
              { id: "tuner" as const, label: "Stimmgerät", icon: <Mic size={15} /> }
            ].map((item) => {
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => changeTab(item.id)}
                  className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-black tracking-wide uppercase transition-all duration-300 cursor-pointer z-10 ${
                    isActive
                      ? "text-[#1a1008]"
                      : "text-[#7a6a58] hover:text-[#c8b8a4]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGlobalTabPill"
                      className="absolute inset-0 bg-[#d4943c] rounded-xl -z-10 shadow-[0_4px_15px_rgba(212,148,60,0.4)]"
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    />
                  )}
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Views with Framer Motion Animators */}
        <AnimatePresence mode="wait">
          {tab === "songwriter" && (
            <motion.div
              key="songwriter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8"
            >
              {/* Circle of Fifths Interactive Wheel */}
              <div className="lg:col-span-7 flex justify-center items-center py-6 relative overflow-hidden">
                <div className="relative flex justify-center items-center scale-[0.82] xs:scale-[0.92] sm:scale-100 transition-all duration-300 origin-center select-none w-full max-w-full">
                  <div className="absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full border-12 border-[#2a1e10] bg-radial from-[#1a1008]/20 to-black/80 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] z-0" />
                  <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] z-10 flex items-center justify-center">
                    {/* Center Key Label */}
                  <div className="text-center pointer-events-none select-none z-20">
                    <span className="block text-4xl sm:text-5xl font-black font-serif text-[#d4943c] tracking-tighter drop-shadow-lg">
                      {CO5_MAJ[selKeyIdx]}
                    </span>
                    <span className="block text-xs uppercase font-mono text-[#7a6a58] mt-1 tracking-widest">
                      Diatonisch
                    </span>
                  </div>

                  {/* Major Outer Chords (12 Key Nodes) */}
                  {CO5.map((semi, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const radius = 135; // px positioning
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const isTonic = semi === selKey;
                    const dia = getDiatonicChords(selKey);
                    const isInKey = dia.some((c) => c.semitone === semi && c.quality === "maj");

                    let borderStyles = "border-neutral-700 hover:border-[#d4943c] bg-[#2a1e10] text-[#c8b8a4]";
                    if (isTonic) {
                      borderStyles = "border-[#d4943c] bg-[#d4943c] text-[#1a1008] shadow-[0_0_20px_rgba(212,148,60,0.6)] font-bold";
                    } else if (isInKey) {
                      borderStyles = "border-[#d4943c] bg-[#2a1e10]/60 text-[#e8b060] shadow-[0_0_12px_rgba(212,148,60,0.25)]";
                    }

                    return (
                      <button
                        key={`maj-${i}`}
                        onClick={() => {
                          setSelKeyIdx(i);
                          addChordToTimeline(CO5_MAJ[i], semi, "maj");
                        }}
                        className={`absolute w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-bold transition-all transform cursor-pointer -translate-x-1/2 -translate-y-1/2 hover:scale-110 z-20 ${borderStyles}`}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`
                        }}
                      >
                        {CO5_MAJ[i]}
                      </button>
                    );
                  })}

                  {/* Minor Inner Chords (12 Key Nodes) */}
                  {CO5.map((_semi, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const radius = 85; // Inner circle radius
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const minS = (_semi + 9) % 12;
                    const isTonicMinor = minS === (selKey + 9) % 12;
                    const dia = getDiatonicChords(selKey);
                    const isInKeyMinor = dia.some((c) => c.semitone === minS && c.quality === "min");

                    let borderStyles = "border-stone-800 hover:border-[#4a9e5c] bg-[#1a1008] text-[#7a6a58]";
                    if (isTonicMinor) {
                      borderStyles = "border-[#4a9e5c] bg-[#4a9e5c] text-[#1a1008] shadow-[0_0_15px_rgba(74,158,92,0.5)] font-bold";
                    } else if (isInKeyMinor) {
                      borderStyles = "border-[#4a9e5c] bg-[#1a1008]/80 text-[#6fc888]";
                    }

                    return (
                      <button
                        key={`min-${i}`}
                        onClick={() => {
                          setSelKeyIdx(i);
                          addChordToTimeline(CO5_MIN[i], minS, "min");
                        }}
                        className={`absolute w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all transform cursor-pointer -translate-x-1/2 -translate-y-1/2 hover:scale-110 z-20 ${borderStyles}`}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`
                        }}
                      >
                        {CO5_MIN[i]}
                      </button>
                    );
                  })}
                  </div>
                </div>
              </div>

              {/* Sidebar: Key Info & Family Panel */}
              <div className="lg:col-span-5 w-full">
                <div className="rounded-2xl bg-[#2a1e10]/95 border border-[#4a3828] p-6 shadow-2xl">
                  {/* Capo + Key Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-serif text-[#d4943c] font-bold">
                      {CO5_MAJ[selKeyIdx]} Major
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#7a6a58] font-bold">Capo:</span>
                      <select
                        value={capo}
                        onChange={(e) => setCapo(Number(e.target.value))}
                        className="bg-[#1a1008] text-[#f0e0cc] border border-[#4a3828] rounded-lg px-2 py-1 text-xs outline-none cursor-pointer hover:border-[#d4943c]"
                      >
                        <option value="0">Aus (0)</option>
                        <option value="1">Bund 1</option>
                        <option value="2">Bund 2</option>
                        <option value="3">Bund 3</option>
                        <option value="4">Bund 4</option>
                        <option value="5">Bund 5</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-[#7a6a58] mb-6">
                    Moll-Paralleltonart: {CO5_MIN[selKeyIdx]}
                  </p>

                  {/* Chord Family Slots */}
                  <h3 className="text-xs font-mono text-[#c8b8a4] uppercase tracking-wider mb-3">
                    Akkord-Familie (Harmonisch)
                  </h3>
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {getDiatonicChords(selKey).map((ch, i) => {
                      const capillaryName = capoName(ch.semitone, ch.suffix);
                      let textColor = "text-[#d4943c]";
                      if (ch.quality === "min") textColor = "text-[#6fc888]";
                      if (ch.quality === "dim") textColor = "text-[#b84a32]";

                      return (
                        <button
                          key={i}
                          onClick={() => addChordToTimeline(ch.name, ch.semitone, ch.quality)}
                          className="bg-[#1a1008] border border-[#4a3828] hover:border-[#d4943c] hover:bg-[#2a1e10] p-2.5 rounded-xl transition-all cursor-pointer text-center group"
                        >
                          <span className="block text-[9px] font-mono text-[#7a6a58] uppercase">
                            {ch.roman}
                          </span>
                          <span className={`block text-base font-bold my-0.5 tracking-tight ${textColor} group-hover:scale-105 transition-transform`}>
                            {capillaryName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Advanced Songwriter Library: Kadenzen & Famous Riffs */}
                  <div className="border-t border-[#4a3828]/40 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-mono text-[#c8b8a4] uppercase tracking-wider">
                        Akkord-Kadenzen & Song-Riffs
                      </h3>
                      <span className="text-[10px] bg-[#d4943c]/15 text-[#d4943c] px-1.5 py-0.5 rounded font-mono font-bold">
                        {PROG_DB.length} Presets
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-none">
                      {/* Section 1: Harmonische Kadenzen */}
                      <div>
                        <span className="block text-[10px] font-mono text-[#7a6a58] uppercase tracking-wider mb-2 font-bold">
                          🌀 Harmonische Kadenzen
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {PROG_DB.filter((p) => p.category === "classic").map((p) => (
                            <div
                              key={p.id}
                              className="group flex items-center justify-between bg-[#1a1008]/80 hover:bg-[#20150c] border border-[#4a3828]/50 hover:border-[#d4943c]/50 p-2 rounded-xl transition-all"
                            >
                              <div className="text-left py-0.5 overflow-hidden">
                                <span className="block text-xs font-bold text-[#c8b8a4] group-hover:text-[#d4943c] transition-colors truncate">
                                  {p.name}
                                </span>
                                <span className="block text-[9px] font-mono text-[#7a6a58] mt-0.5 truncate max-w-[180px]">
                                  {p.chords.map((c) => c.r).join(" - ")}
                                </span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => loadProg(p.id)}
                                  title="Ersetzen"
                                  className="text-[9px] font-bold bg-[#d4943c]/10 hover:bg-[#d4943c] text-[#d4943c] hover:text-[#1a1008] px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  Laden
                                </button>
                                <button
                                  onClick={() => appendProg(p.id)}
                                  title="Anhängen (+)"
                                  className="text-[9px] font-bold bg-[#6fc888]/10 hover:bg-[#6fc888] text-[#6fc888] hover:text-[#1a1008] px-1.5 py-1 rounded transition-all cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Famous Song Riffs */}
                      <div>
                        <span className="block text-[10px] font-mono text-[#7a6a58] uppercase tracking-wider mb-2 font-bold">
                          🎸 Berühmte Song-Riffs (1-Klick)
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {PROG_DB.filter((p) => p.category === "riff").map((p) => (
                            <div
                              key={p.id}
                              className="group flex items-center justify-between bg-[#1a1008]/80 hover:bg-[#20150c] border border-[#4a3828]/50 hover:border-[#d4943c]/50 p-2 rounded-xl transition-all"
                            >
                              <div className="text-left py-0.5 overflow-hidden">
                                <span className="block text-xs font-bold text-[#f0e0cc] group-hover:text-[#d4943c] transition-colors truncate max-w-[170px]">
                                  {p.name}
                                </span>
                                <span className="block text-[9px] font-mono text-[#7a6a58] mt-0.5 truncate max-w-[170px]">
                                  {p.songs[0]}
                                </span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => loadProg(p.id)}
                                  title="Ersetzen"
                                  className="text-[9px] font-bold bg-[#d4943c]/10 hover:bg-[#d4943c] text-[#d4943c] hover:text-[#1a1008] px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  Laden
                                </button>
                                <button
                                  onClick={() => appendProg(p.id)}
                                  title="Anhängen (+)"
                                  className="text-[9px] font-bold bg-[#6fc888]/10 hover:bg-[#6fc888] text-[#6fc888] hover:text-[#1a1008] px-1.5 py-1 rounded transition-all cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "theorie" && (
            <motion.div
              key="theorie"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Educational info */}
              <div className="rounded-2xl bg-[#2a1e10] border border-[#4a3828] p-6 shadow-xl">
                <h2 className="text-xl font-serif text-[#d4943c] font-bold mb-3">
                  Der Quintenzirkel
                </h2>
                <p className="text-sm text-[#c8b8a4] leading-relaxed">
                  Der Quintenzirkel ordnet alle 12 musikalischen Tonarten mathematisch im Kreis an. Jeder Schritt im Uhrzeigersinn erhöht die Tonart um eine reine Quinte (7 Halbtöne). Er dient Songwritern als perfektes Tool, um harmonisch passende Harmonien und Modulationen spielerisch zu entdecken.
                </p>
              </div>

              {/* Theory Progressions list */}
              <div className="rounded-2xl bg-[#2a1e10] border border-[#4a3828] p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#4a3828]/40 pb-4">
                  <h2 className="text-xl font-serif text-[#d4943c] font-bold">
                    Klassische Akkordstrukturen
                  </h2>
                  <div className="flex items-center gap-2 bg-[#1a1008] px-3 py-1.5 rounded-xl border border-[#4a3828]">
                    <span className="text-xs text-[#7a6a58] font-semibold">Demo:</span>
                    <button
                      onClick={() => setTheoryKey((prev) => (prev - 1 + 12) % 12)}
                      className="text-xs p-1 hover:text-[#d4943c]"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-[#d4943c]">
                      {SHARP[theoryKey]}
                    </span>
                    <button
                      onClick={() => setTheoryKey((prev) => (prev + 1) % 12)}
                      className="text-xs p-1 hover:text-[#d4943c]"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {PROG_DB.map((p) => {
                    const mappedChords = p.chords.map((c) => {
                      const semi = (theoryKey + c.s) % 12;
                      const sfx = c.q === "min" ? "m" : (c.q as string) === "dim" ? "dim" : "";
                      return noteNameAny(semi, theoryKey) + sfx;
                    });

                    return (
                      <div
                        key={p.id}
                        className="bg-[#1a1008] border border-[#4a3828] rounded-xl p-4 transition-all hover:border-[#d4943c]/50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-[#d4943c]">{p.name}</h4>
                          <span className="text-[10px] font-mono text-[#7a6a58] italic uppercase">
                            {p.chords.map((c) => c.r).join(" — ")}
                          </span>
                        </div>
                        <div className="text-lg font-black tracking-tight my-2">
                          {mappedChords.join(" — ")}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.songs.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-[#d4943c]/10 text-[#e8b060] border border-[#d4943c]/15 px-2 py-0.5 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-[#7a6a58] leading-relaxed mb-3">
                          {p.desc}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              loadProg(p.id, theoryKey);
                            }}
                            className="text-[10px] font-bold text-[#d4943c] bg-[#d4943c]/10 border border-[#d4943c]/30 px-3 py-1.5 rounded-lg hover:bg-[#d4943c] hover:text-[#1a1008] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Play size={10} fill="currentColor" /> In Timeline laden
                          </button>
                          <button
                            onClick={() => {
                              appendProg(p.id, theoryKey);
                            }}
                            className="text-[10px] font-bold text-[#6fc888] bg-[#6fc888]/10 border border-[#6fc888]/30 px-3 py-1.5 rounded-lg hover:bg-[#6fc888] hover:text-[#1a1008] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={10} /> + An Timeline anhängen
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "tuner" && (
            <motion.div
              key="tuner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-sm mx-auto"
            >
              <div className="rounded-2xl bg-[#2a1e10] border border-[#4a3828] p-6 text-center shadow-xl">
                {/* Gauge visualization using SVG for precise smooth needle movement */}
                <div className="relative h-32 w-full flex items-center justify-center">
                  <svg viewBox="0 0 300 150" className="w-full max-w-[240px]">
                    <path
                      d="M 30 140 A 110 110 0 0 1 270 140"
                      fill="none"
                      stroke="#4a3828"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 110 38 A 110 110 0 0 1 190 38"
                      fill="none"
                      stroke="#4a9e5c"
                      strokeWidth="10"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                    {/* Gauge needle rotates based on cents deviation (-50 to +50 cents = -45 to +45 deg) */}
                    <line
                      x1="150"
                      y1="140"
                      x2="150"
                      y2="30"
                      stroke="#f0e0cc"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{
                        transform: `rotate(${(tunerCents / 50) * 45}deg)`,
                        transformOrigin: "150px 140px",
                        transition: "transform 0.08s ease-out"
                      }}
                    />
                    <circle cx="150" cy="140" r="8" fill="#1a1008" stroke="#d4943c" strokeWidth="2" />
                  </svg>
                </div>

                {/* Detected Note */}
                <div className="text-6xl font-serif font-black text-[#f0e0cc] tracking-tighter my-2">
                  {tunerNote}
                </div>

                {/* Status metrics */}
                <div className="flex justify-center gap-6 text-xs text-[#7a6a58] font-mono border-t border-b border-[#4a3828]/40 py-3 mb-6">
                  <div>
                    <span className="text-[#c8b8a4]">Abweichung:</span>{" "}
                    <span className="font-extrabold text-[#d4943c]">
                      {tunerCents > 0 ? `+${tunerCents}` : tunerCents} Cents
                    </span>
                  </div>
                  <div>
                    <span className="text-[#c8b8a4]">Frequenz:</span>{" "}
                    <span className="font-extrabold text-[#d4943c]">
                      {tunerHz > 0 ? `${tunerHz} Hz` : "-"}
                    </span>
                  </div>
                </div>

                {/* Interactive Guitar Strings Reference */}
                <div className="flex justify-center gap-2 mb-6">
                  {guitarStringsArr.map((str) => (
                    <button
                      key={str.name}
                      onClick={() => handleStringClick(str.name)}
                      className={`w-9 h-9 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        activeGuitarString === str.name
                          ? "bg-[#d4943c]/20 border-[#d4943c] text-[#d4943c] scale-110 shadow-lg"
                          : "bg-[#1a1008] border-[#4a3828] text-[#7a6a58] hover:text-[#f0e0cc]"
                      }`}
                    >
                      {str.label}
                    </button>
                  ))}
                </div>

                {/* Mic Activating Controls */}
                <button
                  onClick={startTuner}
                  className={`w-full py-3 px-6 rounded-xl text-sm font-bold select-none cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md ${
                    isTunerRunning
                      ? "bg-[#b84a32] text-white hover:bg-[#b84a32]/80"
                      : "bg-[#d4943c] text-[#1a1008] hover:bg-[#d4943c]/85"
                  }`}
                >
                  <Mic size={16} />
                  {isTunerRunning ? "Stimmgerät stoppen" : "Mikrofon aktivieren"}
                </button>
                <p className="text-[10px] text-[#7a6a58] mt-2 font-mono">
                  {isTunerRunning ? "Höre Audio-Input..." : "Referenzton durch Klicken anspielen"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Audio Rack Controller Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#2a1e10] border-t-2 border-[#4a3828] z-40 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-4 md:pb-6">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-4 relative">
          {/* Collapse/Expand Toggle Tab */}
          <button
            onClick={() => setIsFooterMinimized(!isFooterMinimized)}
            className="absolute -top-[36px] right-6 bg-[#25D366] text-[#1a1008] text-[10px] font-black tracking-wider uppercase px-4 py-2 rounded-t-xl z-50 flex items-center gap-1.5 cursor-pointer transition-all hover:bg-[#20ba59] hover:text-white shadow-[0_-4px_12px_rgba(37,211,102,0.45)] border-0"
          >
            {isFooterMinimized ? (
              <>
                <ChevronUp size={12} className="font-extrabold" /> Control Rack maximieren
              </>
            ) : (
              <>
                <ChevronDown size={12} className="font-extrabold" /> Control Rack minimieren
              </>
            )}
          </button>

          {isFooterMinimized ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1.5">
              {/* Left Side: Playback State info */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={playing ? stopPlay : startPlay}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shrink-0 ${
                    playing
                      ? "bg-[#b84a32] text-white"
                      : "bg-[#d4943c] text-[#1a1008]"
                  }`}
                >
                  {playing ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                  {playing ? "Stopp" : "Abspielen"}
                </button>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-[#7a6a58] uppercase tracking-wider font-bold">
                    Rack {playing ? "spielt..." : "bereit"}
                  </span>
                  <span className="text-xs font-bold text-[#f0e0cc]">
                    {timeline.length} Akkorde • {bpm} BPM • {currentInst === "piano" ? "🎹 Piano" : currentInst === "guitar" ? "🎸 Gitarre" : currentInst === "ukulele" ? "🪕 Ukulele" : currentInst === "strings" ? "🎻 Strings" : currentInst === "synth" ? "🎛️ Synth" : "🎸 Bass"}
                  </span>
                </div>
              </div>

              {/* Middle Section: Mini sequence view (perfect to see chords progression playing while minimized) */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-md px-3 py-2 bg-[#1a1008]/40 rounded-xl border border-[#4a3828]/50 scrollbar-none w-full sm:w-auto">
                {timeline.length === 0 ? (
                  <span className="text-[10px] text-[#7a6a58] font-mono py-0.5">Timeline leer</span>
                ) : (
                  timeline.map((item, idx) => {
                    const isActive = idx === playIdx;
                    if (item.type === "label") {
                      return (
                        <div
                          key={item.id}
                          className={`px-2 py-0.5 rounded-lg text-[8px] border shrink-0 font-bold ${
                            isActive
                              ? "border-[#d4943c] bg-[#d4943c]/15 text-[#d4943c]"
                              : "border-emerald-600/20 bg-emerald-950/10 text-emerald-400"
                          }`}
                        >
                          {item.name}
                        </div>
                      );
                    }
                    const capillaryName = capoName(item.semitone ?? 0, item.suffix ?? "");
                    let textCol = "text-[#d4943c]";
                    if (item.quality === "min") textCol = "text-[#6fc888]";
                    if (item.quality === "dim") textCol = "text-[#b84a32]";
                    return (
                      <div
                        key={item.id}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] border shrink-0 font-extrabold flex items-center gap-1 ${
                          isActive
                            ? "border-[#d4943c] bg-[#d4943c]/20 shadow-[0_0_8px_rgba(212,148,60,0.25)] scale-102"
                            : "border-[#4a3828] bg-[#1a1008]"
                        }`}
                      >
                        <span className="text-[8px] text-[#7a6a58] font-mono">{idx + 1}</span>
                        <span className={textCol}>{capillaryName}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Side: Quick share action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={copyProgression}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#1a1008] border border-[#4a3828] text-[#c8b8a4] hover:text-[#d4943c] hover:border-[#d4943c]"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#25D366]/20 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/35"
                >
                  <Share2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-[64vh] sm:max-h-none overflow-y-auto pr-1.5 scrollbar-thin space-y-3 pb-2 md:pb-0">
              {/* Row 1: Sound Instruments */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1.5 scrollbar-thin">
                <span className="text-xs font-mono text-[#7a6a58] uppercase font-bold pr-1">
                  Instrument:
                </span>
                {[
                  { id: "piano", label: "Piano", icon: <Music size={12} /> },
                  { id: "guitar", label: "Gitarre", icon: <Guitar size={12} /> },
                  { id: "ukulele", label: "Ukulele", icon: <Sliders size={12} /> },
                  { id: "strings", label: "Strings", icon: <Waves size={12} /> },
                  { id: "synth", label: "Synth", icon: <SlidersHorizontal size={12} /> },
                  { id: "bass", label: "Bass", icon: <Music size={12} /> }
                ].map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setCurrentInst(inst.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      currentInst === inst.id
                        ? "bg-[#d4943c] text-[#1a1008] font-black"
                        : "bg-[#1a1008] border border-[#4a3828] text-[#7a6a58] hover:text-[#f0e0cc]"
                    }`}
                  >
                    {inst.icon}
                    {inst.label}
                  </button>
                ))}
              </div>

              {/* Row 2: Transport & Metronome BPM & Strum Options */}
              <div className="flex flex-wrap items-center gap-3 mb-3 pb-2 border-b border-[#4a3828]/40">
                {/* Transport controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={playing ? stopPlay : startPlay}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none shadow-md ${
                      playing
                        ? "bg-[#b84a32] text-white"
                        : "bg-[#d4943c] text-[#1a1008]"
                    }`}
                  >
                    {playing ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                    {playing ? "Stopp" : "Abspielen"}
                  </button>
                  <button
                    onClick={clearTimeline}
                    title="Löschen"
                    className="p-2.5 rounded-xl bg-[#1a1008] border border-[#4a3828] hover:border-[#b84a32] hover:text-[#b84a32] transition-all cursor-pointer text-[#7a6a58]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="h-5 w-px bg-[#4a3828]" />

                {/* Transpose */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => transposeTimeline(-1)}
                    className="p-1.5 rounded-lg bg-[#1a1008] border border-[#4a3828] text-xs hover:text-[#d4943c] cursor-pointer"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-xs font-mono font-bold text-[#c8b8a4] px-1">Transpose</span>
                  <button
                    onClick={() => transposeTimeline(1)}
                    className="p-1.5 rounded-lg bg-[#1a1008] border border-[#4a3828] text-xs hover:text-[#d4943c] cursor-pointer"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <div className="h-5 w-px bg-[#4a3828]" />

                {/* Signature & Strumming Style */}
                <button
                  onClick={() => setBeatsPerBar((p) => (p === 4 ? 3 : 4))}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1008] border border-[#4a3828] text-xs font-medium hover:border-[#d4943c] cursor-pointer"
                >
                  {beatsPerBar}/4 Takt
                </button>

                {/* Rhythm Style Selector (Slick iOS Segmented Control) */}
                <div className="flex bg-[#120a04] p-0.5 rounded-xl border border-[#4a3828]/40 select-none items-center relative gap-0.5 overflow-x-auto scrollbar-none shrink-0">
                  <span className="text-[10px] font-mono text-[#7a6a58] px-2 font-bold uppercase shrink-0">
                    Style:
                  </span>
                  {STRUM_OPTIONS.map((opt) => {
                    const isActive = strumPattern === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setStrumPattern(opt.id as any)}
                        className={`relative px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap z-10 shrink-0 ${
                          isActive ? "text-[#1a1008] font-extrabold" : "text-[#7a6a58] hover:text-[#c8b8a4]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeStrumPill"
                            className="absolute inset-0 bg-[#d4943c] rounded-lg -z-10 shadow-[0_2px_8px_rgba(212,148,60,0.35)]"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                        <span className="flex items-center gap-1">
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="h-5 w-px bg-[#4a3828]" />

                {/* BPM Slider & Presets */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#7a6a58] font-bold">BPM</span>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-16 accent-[#d4943c] cursor-ew-resize"
                  />
                  <span className="text-xs font-mono font-extrabold text-[#d4943c] w-7">
                    {bpm}
                  </span>
                  {/* Quick BPM Presets */}
                  {[70, 90, 100, 120, 140].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBpm(b)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border text-center transition-all cursor-pointer ${
                        bpm === b
                          ? "bg-[#d4943c]/20 border-[#d4943c] text-[#d4943c] font-black"
                          : "bg-[#1a1008] border-[#4a3828] text-[#7a6a58]"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Advanced Drum & Bass Rhythm Configs (Slick iOS Channel Strip Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-3 border-b border-[#4a3828]/40">
                {/* Channel Strip 1: Drums System */}
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 shrink-0">
                    {/* iOS style Toggle Switch */}
                    <button
                      onClick={() => setDrumsOn(!drumsOn)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center shrink-0 ${
                        drumsOn ? "bg-[#4a9e5c]" : "bg-[#120a04] border border-[#4a3828]/60"
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow-md"
                        style={{ x: drumsOn ? 20 : 0 }}
                      />
                    </button>
                    <div className="text-left font-semibold">
                      <span className="block text-xs text-[#c8b8a4]">Schlagzeug (Drums)</span>
                      <span className="block text-[10px] text-[#7a6a58] font-mono tracking-wide">
                        STATUS: {drumsOn ? "ACTIVE" : "MUTED"}
                      </span>
                    </div>
                  </div>

                  {/* iOS Style Segmented Control */}
                  <div className="flex bg-[#120a04] p-0.5 rounded-xl border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none w-full sm:w-auto relative gap-0.5 items-center">
                    {DRUM_OPTIONS.map((opt) => {
                      const isActive = drumPattern === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setDrumPattern(opt.id)}
                          className={`relative px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap z-10 shrink-0 ${
                            isActive ? "text-[#1a1008] font-extrabold" : "text-[#7a6a58] hover:text-[#c8b8a4]"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeDrumPill"
                              className="absolute inset-0 bg-[#d4943c] rounded-lg -z-10 shadow-[0_2px_8px_rgba(212,148,60,0.35)]"
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                          )}
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs">{opt.icon}</span>
                            <span>{opt.label}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Channel Strip 2: Bass System */}
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 shrink-0">
                    {/* iOS style Toggle Switch */}
                    <button
                      onClick={() => setBasslineOn(!basslineOn)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center shrink-0 ${
                        basslineOn ? "bg-[#4a9e5c]" : "bg-[#120a04] border border-[#4a3828]/60"
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow-md"
                        style={{ x: basslineOn ? 20 : 0 }}
                      />
                    </button>
                    <div className="text-left font-semibold">
                      <span className="block text-xs text-[#c8b8a4]">Bass-Line (Routine)</span>
                      <span className="block text-[10px] text-[#7a6a58] font-mono tracking-wide">
                        STATUS: {basslineOn ? "ACTIVE" : "MUTED"}
                      </span>
                    </div>
                  </div>

                  {/* iOS Style Segmented Control */}
                  <div className="flex bg-[#120a04] p-0.5 rounded-xl border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none w-full sm:w-auto relative gap-0.5 items-center">
                    {BASS_OPTIONS.map((opt) => {
                      const isActive = bassPattern === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setBassPattern(opt.id)}
                          className={`relative px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap z-10 shrink-0 ${
                            isActive ? "text-[#1a1008] font-extrabold" : "text-[#7a6a58] hover:text-[#c8b8a4]"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeBassPill"
                              className="absolute inset-0 bg-[#d4943c] rounded-lg -z-10 shadow-[0_2px_8px_rgba(212,148,60,0.35)]"
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                          )}
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs">{opt.icon}</span>
                            <span>{opt.label}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 4: Timeline Sequence Container */}
              <div className="flex gap-2.5 overflow-x-auto py-2 px-1 min-h-[70px] bg-[#1a1008]/40 rounded-xl border border-[#4a3828]/50 scrollbar-thin mb-3">
                {timeline.length === 0 ? (
                  <span className="text-xs text-[#7a6a58] font-mono m-auto">
                    Klicke auf Akkorde oben, um dein Song-Grid aufzubauen...
                  </span>
                ) : (
                  <AnimatePresence>
                    {timeline.map((item, idx) => {
                      const isActive = idx === playIdx;
                      if (item.type === "label") {
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`flex-shrink-0 relative overflow-visible px-4 py-3 rounded-xl border flex items-center justify-center transition-all ${
                              isActive
                                ? "border-[#d4943c] bg-[#d4943c]/15 text-[#d4943c]"
                                : "border-emerald-600/40 bg-emerald-900/10 text-emerald-400"
                            }`}
                          >
                            <span className="text-xs font-bold tracking-widest uppercase text-center select-none">
                              {item.name}
                            </span>
                            <button
                              onClick={() => removeTimelineItem(item.id)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#b84a32] text-white flex items-center justify-center text-[8px] border border-[#1a1008] cursor-pointer"
                            >
                              <X size={8} />
                            </button>
                          </motion.div>
                        );
                      }

                      const capillaryName = capoName(item.semitone ?? 0, item.suffix ?? "");
                      let textCol = "text-[#d4943c]";
                      if (item.quality === "min") textCol = "text-[#6fc888]";
                      if (item.quality === "dim") textCol = "text-[#b84a32]";

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => {
                            if (item.semitone !== undefined && item.quality) {
                              playChordInst(item.semitone, item.quality, 0.7, strumPattern);
                            }
                          }}
                          className={`flex-shrink-0 w-16 h-16 rounded-xl border flex flex-col items-center justify-center relative cursor-pointer group transition-all ${
                            isActive
                              ? "border-[#d4943c] bg-[#d4943c]/15 shadow-[0_0_12px_rgba(212,148,60,0.3)] scale-105"
                              : "border-[#4a3828] bg-[#1a1008] hover:border-[#c8b8a4]"
                          }`}
                        >
                          <span className="text-[8px] font-mono text-[#7a6a58] absolute top-1 left-2">
                            {idx + 1}
                          </span>
                          <span className={`text-sm font-black tracking-tight ${textCol}`}>
                            {capillaryName}
                          </span>
                          {item.roman && (
                            <span className="text-[9px] font-mono text-[#7a6a58] mt-0.5 uppercase">
                              {item.roman}
                            </span>
                          )}

                          {/* Micro arrange controls positioning on Hover */}
                          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 bg-[#2a1e10] p-0.5 rounded border border-[#4a3828] z-30">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTimelineItem(item.id, -1);
                              }}
                              className="p-0.5 hover:text-[#d4943c]"
                            >
                              <ChevronLeft size={10} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTimelineItem(item.id, 1);
                              }}
                              className="p-0.5 hover:text-[#d4943c]"
                            >
                              <ChevronRight size={10} />
                            </button>
                          </div>

                          {/* delete node */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTimelineItem(item.id);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-[#b84a32] text-white flex items-center justify-center text-[8px] border border-[#1a1008] cursor-pointer"
                          >
                            <X size={8} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Row 5: Parts Share, Labels Adder */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs font-mono text-[#7a6a58] font-bold">Akkord-Teil:</span>
                {["Intro", "Verse", "Refrain", "Chorus", "Bridge", "Outro"].map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => addLabelToTimeline(lbl)}
                    className="text-[10px] bg-[#1a1008] border border-[#4a3828] text-[#c8b8a4] hover:border-[#4a9e5c] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold"
                  >
                    + {lbl}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={copyProgression}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#1a1008] border border-[#4a3828] text-[#c8b8a4] hover:text-[#d4943c] hover:border-[#d4943c]"
                  >
                    <Copy size={12} /> Text kopieren
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#25D366]/20 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/35"
                  >
                    <Share2 size={12} /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Guide Help Modal */}
      <AnimatePresence>
        {infoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInfoModalOpen(false)}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#2a1e10] border border-[#4a3828] p-6 rounded-2xl max-w-lg w-full text-sm leading-relaxed"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-serif text-[#d4943c] font-black">
                  ChordWood Handbuch
                </h2>
                <button
                  onClick={() => setInfoModalOpen(false)}
                  className="p-1 text-[#7a6a58] hover:text-[#f0e0cc]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-[#c8b8a4]">
                <p>
                  ChordWood ist das ultimative interaktive Tool für Gitarristen, Musiker und Songwriter, um Harmoniekonzepte des <strong>Quintenzirkels</strong> praktisch zu entdecken.
                </p>
                <div>
                  <h4 className="font-bold text-[#f0e0cc] mb-1">🎹 Songwriter View</h4>
                  <p className="text-xs">
                    Klicke im Kreis, um Tonarten zu wählen und diatonische Akkorde zu deiner Timeline hinzuzufügen. Das Tool beleuchtet automatisch die 7 diatonisch passenden Begleitakkorde des gewählten Tonzentrums.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#f0e0cc] mb-1">🥁 Begleit-Rhythmus Rack</h4>
                  <p className="text-xs">
                    Schalte Drums und Bassbacken an und steuere im Audiomischpult das Arrangement. Ändere die Begleit-Patterns für flexiblere Rhythmen wie Classic Rock, Trap oder Bossa.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#f0e0cc] mb-1">🎸 Integriertes Stimmgerät</h4>
                  <p className="text-xs">
                    Nutze die reaktive Pitch-Erkennung (YIN) für genaue Stimmung deiner Gitarre oder spiele Referenztöne direkt an.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className="fixed bottom-96 left-1/2 -translate-x-1/2 bg-[#2a1e10] border border-[#d4943c] px-4 py-2 rounded-xl text-xs font-semibold z-50 text-[#f0e0cc] shadow-2xl shadow-black"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
