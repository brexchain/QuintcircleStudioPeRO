/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
  type: "chord" | "label" | "recording";
  name: string;
  semitone?: number;
  quality?: "maj" | "min" | "dim";
  suffix?: string;
  roman?: string;
  id: number;
  audioBuffer?: AudioBuffer | null;
  audioUrl?: string;
  duration?: number;
}

// Theoretical progressions DB
// Theoretical progressions DB with explicit categories and extensive physical preset configurations (BPM, Style, Instrument, and Pedalboard FX Chain)
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
    desc: "Die meistgenutzte Pop-Akkordfolge überhaupt.",
    bpm: 110,
    strumPattern: "strum" as const,
    drumPattern: "standard",
    bassPattern: "root",
    currentInst: "piano",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 2.2, mix: 0.35 }
    }
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
    desc: "Der klassische, energiegeladene 3-Akkord-Rock.",
    bpm: 135,
    strumPattern: "strum" as const,
    drumPattern: "rock",
    bassPattern: "walk",
    currentInst: "guitar_electric_dist",
    pedalboard: {
      overdrive: { active: true, drive: 0.6, tone: 0.5, volume: 0.7 },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 1.5, mix: 0.25 }
    }
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
    desc: "Beginnt in der Paralleltonart (Moll) für emotionale Tiefe.",
    bpm: 82,
    strumPattern: "arpeggio" as const,
    drumPattern: "standard",
    bassPattern: "melodic",
    currentInst: "piano",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: true, time: 0.4, feedback: 0.5, mix: 0.3 },
      reverb: { active: true, decay: 3.5, mix: 0.45 }
    }
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
    desc: "Der ikonische Sound der goldenen 50er Jahre.",
    bpm: 90,
    strumPattern: "strum" as const,
    drumPattern: "standard",
    bassPattern: "root",
    currentInst: "piano",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: true, rate: 1.5, depth: 0.35, mix: 0.3 },
      delay: { active: false },
      reverb: { active: true, decay: 2.0, mix: 0.3 }
    }
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
    desc: "Ein treibender, zyklischer Spannungsbogen.",
    bpm: 105,
    strumPattern: "strum" as const,
    drumPattern: "standard",
    bassPattern: "syncopated",
    currentInst: "guitar_acoustic",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: true, rate: 2.0, depth: 0.2, mix: 0.3 },
      delay: { active: false },
      reverb: { active: true, decay: 2.5, mix: 0.3 }
    }
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
    desc: "Aus der traditionellen spanischen Musik und Flamenco.",
    bpm: 115,
    strumPattern: "strum" as const,
    drumPattern: "latin",
    bassPattern: "melodic",
    currentInst: "guitar",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 2.5, mix: 0.35 }
    }
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
    desc: "Barocke Perfektion, die die zeitgenössische Musik prägt.",
    bpm: 78,
    strumPattern: "arpeggio" as const,
    drumPattern: "standard",
    bassPattern: "root",
    currentInst: "strings",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 3.0, mix: 0.4 }
    }
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
    desc: "Ein meditativer Pendelschlag zwischen Tonika (I) und Subdominante (IV).",
    bpm: 65,
    strumPattern: "block" as const,
    drumPattern: "standard",
    bassPattern: "root",
    currentInst: "piano",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 4.0, mix: 0.5 }
    }
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
    desc: "Das fundamentale 12-Takt-Formular aller Blues- und Jam-Klassiker.",
    bpm: 112,
    strumPattern: "strum" as const,
    drumPattern: "rock",
    bassPattern: "walk",
    currentInst: "guitar_electric_clean",
    pedalboard: {
      overdrive: { active: true, drive: 0.25, tone: 0.6, volume: 0.85 },
      chorus: { active: false },
      delay: { active: true, time: 0.2, feedback: 0.2, mix: 0.25 },
      reverb: { active: true, decay: 1.8, mix: 0.2 }
    }
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
    desc: "Die beliebteste Kadenz asiatischer Musik für epische, vorwärtsstrebende Melodien.",
    bpm: 128,
    strumPattern: "strum" as const,
    drumPattern: "rock",
    bassPattern: "syncopated",
    currentInst: "synth",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: true, time: 0.35, feedback: 0.4, mix: 0.35 },
      reverb: { active: true, decay: 2.5, mix: 0.3 }
    }
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
    desc: "Ein butterweiches Jazz-Pattern (ii - V - I - IV) voller Eleganz und Groove.",
    bpm: 92,
    strumPattern: "strum" as const,
    drumPattern: "funk",
    bassPattern: "melodic",
    currentInst: "guitar_electric_clean",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: true, rate: 1.0, depth: 0.4, mix: 0.4 },
      delay: { active: false },
      reverb: { active: true, decay: 2.0, mix: 0.25 }
    }
  },
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
    desc: "Das ikonischste Riff der Gitarrengeschichte als vollständige, perfekt aufgelöste 12-taktige Akkordfolge.",
    bpm: 112,
    strumPattern: "block" as const,
    drumPattern: "rock",
    bassPattern: "root",
    currentInst: "guitar_electric_dist",
    pedalboard: {
      overdrive: { active: true, drive: 0.85, tone: 0.5, volume: 0.75 },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 1.2, mix: 0.2 }
    }
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
    desc: "Der legendäre, melancholische Akkord-Kreis mit absteigender Quinten-Struktur.",
    bpm: 74,
    strumPattern: "arpeggio" as const,
    drumPattern: "latin",
    bassPattern: "root",
    currentInst: "guitar_acoustic",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: true, time: 0.38, feedback: 0.4, mix: 0.3 },
      reverb: { active: true, decay: 2.2, mix: 0.25 }
    }
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
    desc: "Das ultimative Akustik-Gitarren-Lagerfeuer-Riff mit schwebendem Charakter.",
    bpm: 88,
    strumPattern: "strum" as const,
    drumPattern: "standard",
    bassPattern: "root",
    currentInst: "guitar_acoustic",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: true, rate: 1.2, depth: 0.25, mix: 0.25 },
      delay: { active: false },
      reverb: { active: true, decay: 1.8, mix: 0.2 }
    }
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
    desc: "Bittersüßer Klang durch den moderen Austausch der Moll-Subdominante (iv).",
    bpm: 92,
    strumPattern: "block" as const,
    drumPattern: "rock",
    bassPattern: "root",
    currentInst: "guitar_electric_clean",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 2.8, mix: 0.3 }
    }
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
    desc: "Das ikonischen Grunge-Vier-Akkord-Riff für dröhnende Gitarrengrooves.",
    bpm: 117,
    strumPattern: "strum" as const,
    drumPattern: "rock",
    bassPattern: "octave",
    currentInst: "guitar_electric_dist",
    pedalboard: {
      overdrive: { active: true, drive: 0.9, tone: 0.6, volume: 0.7 },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 1.5, mix: 0.25 }
    }
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
    desc: "Treibender, sonniger mixolydischer Sound (I - bVII - IV - I).",
    bpm: 125,
    strumPattern: "strum" as const,
    drumPattern: "rock",
    bassPattern: "syncopated",
    currentInst: "guitar_electric_clean",
    pedalboard: {
      overdrive: { active: true, drive: 0.5, tone: 0.7, volume: 0.7 },
      chorus: { active: false },
      delay: { active: true, time: 0.35, feedback: 0.35, mix: 0.35 },
      reverb: { active: true, decay: 2.0, mix: 0.25 }
    }
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
    desc: "Disco/Soul Loop der Extraklasse mit unwiderstehlichem Drang.",
    bpm: 116,
    strumPattern: "strum" as const,
    drumPattern: "funk",
    bassPattern: "octave",
    currentInst: "guitar_electric_clean",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: true, rate: 2.2, depth: 0.3, mix: 0.35 },
      delay: { active: false },
      reverb: { active: true, decay: 1.5, mix: 0.2 }
    }
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
    desc: "Welliges Arpeggio-Pattern mit markant abfallendem Moll-Dominant-Wechsel.",
    bpm: 121,
    strumPattern: "arpeggio" as const,
    drumPattern: "standard",
    bassPattern: "syncopated",
    currentInst: "piano",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: true, time: 0.38, feedback: 0.45, mix: 0.4 },
      reverb: { active: true, decay: 2.5, mix: 0.3 }
    }
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
    desc: "Zart voranschreitende Melancholie, die das tonale Zentrum (I) meidet.",
    bpm: 75,
    strumPattern: "arpeggio" as const,
    drumPattern: "standard",
    bassPattern: "root",
    currentInst: "guitar_acoustic",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: false },
      delay: { active: false },
      reverb: { active: true, decay: 2.8, mix: 0.35 }
    }
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
    desc: "Ein herrlich offener Mixolydischer Vibe: I - bVII - IV (in Key G: D - C - G).",
    bpm: 115,
    strumPattern: "strum" as const,
    drumPattern: "rock",
    bassPattern: "walk",
    currentInst: "guitar_electric_clean",
    pedalboard: {
      overdrive: { active: true, drive: 0.15, tone: 0.5, volume: 0.7 },
      chorus: { active: true, rate: 1.0, depth: 0.35, mix: 0.3 },
      delay: { active: false },
      reverb: { active: true, decay: 1.8, mix: 0.25 }
    }
  },
  {
    id: "around_world",
    name: "Funk-House Groove",
    category: "riff",
    chords: [
      { s: 2, q: "min" as const, r: "ii" },
      { s: 9, q: "min" as const, r: "vi" },
      { s: 4, q: "min" as const, r: "iii" },
      { s: 5, q: "maj" as const, r: "IV" }
    ],
    songs: ["Around the World — Daft Punk", "Classic Filter House"],
    desc: "Ein hypnotischer, treibender House-Groove mit geschmeidiger Akkordfolge.",
    bpm: 121,
    strumPattern: "strum" as const,
    drumPattern: "funk",
    bassPattern: "octave",
    currentInst: "synth",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: true, rate: 1.8, depth: 0.45, mix: 0.4 },
      delay: { active: true, time: 0.33, feedback: 0.3, mix: 0.25 },
      reverb: { active: true, decay: 1.8, mix: 0.25 }
    }
  },
  {
    id: "purple_rain",
    name: "Purple Rain Power Ballad",
    category: "riff",
    chords: [
      { s: 0, q: "maj" as const, r: "I" },
      { s: 9, q: "min" as const, r: "vi" },
      { s: 7, q: "maj" as const, r: "V" },
      { s: 5, q: "maj" as const, r: "IV" }
    ],
    songs: ["Purple Rain — Prince", "Classic Power Ballads"],
    desc: "Die monumentale lila Ballade mit üppigem Chorus-Teppich und endlosem Delay.",
    bpm: 76,
    strumPattern: "strum" as const,
    drumPattern: "standard",
    bassPattern: "root",
    currentInst: "guitar_electric_clean",
    pedalboard: {
      overdrive: { active: false },
      chorus: { active: true, rate: 1.5, depth: 0.7, mix: 0.65 },
      delay: { active: true, time: 0.42, feedback: 0.5, mix: 0.4 },
      reverb: { active: true, decay: 3.5, mix: 0.4 }
    }
  },
  {
    id: "heavy_gallop",
    name: "Metal Gallop (Aeolian Power)",
    category: "riff",
    chords: [
      { s: 9, q: "min" as const, r: "i" },
      { s: 5, q: "maj" as const, r: "VI" },
      { s: 7, q: "maj" as const, r: "VII" },
      { s: 9, q: "min" as const, r: "i" }
    ],
    songs: ["The Trooper — Iron Maiden", "Hallowed Be Thy Name"],
    desc: "Dramatisches, treibendes Moll-Riff für galoppierende Double-Bass Metal-Grooves.",
    bpm: 140,
    strumPattern: "block" as const,
    drumPattern: "rock",
    bassPattern: "octave",
    currentInst: "guitar_electric_dist",
    pedalboard: {
      overdrive: { active: true, drive: 0.95, tone: 0.65, volume: 0.75 },
      chorus: { active: false },
      delay: { active: true, time: 0.28, feedback: 0.2, mix: 0.2 },
      reverb: { active: true, decay: 1.5, mix: 0.25 }
    }
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

const FX_PRESETS = [
  {
    id: "bypass",
    name: "Dry Bypass",
    icon: "📴",
    desc: "Bypass / Kein Effekt",
    settings: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: false, rate: 1.5, depth: 0.35, mix: 0.4 },
      delay: { active: false, time: 0.38, feedback: 0.45, mix: 0.4 },
      reverb: { active: false, decay: 2.2, mix: 0.35 }
    }
  },
  {
    id: "crunchy",
    name: "Warm Crunch",
    icon: "🔥",
    desc: "Feine Röhrensättigung",
    settings: {
      overdrive: { active: true, drive: 0.52, tone: 0.6, volume: 0.8 },
      chorus: { active: false, rate: 1.5, depth: 0.35, mix: 0.4 },
      delay: { active: false, time: 0.38, feedback: 0.45, mix: 0.4 },
      reverb: { active: true, decay: 1.8, mix: 0.22 }
    }
  },
  {
    id: "heavy_lead",
    name: "Heavy Metal",
    icon: "🤘",
    desc: "Satt verzerrtes Brett",
    settings: {
      overdrive: { active: true, drive: 0.95, tone: 0.75, volume: 0.95 },
      chorus: { active: true, rate: 1.8, depth: 0.3, mix: 0.45 },
      delay: { active: true, time: 0.32, feedback: 0.4, mix: 0.35 },
      reverb: { active: true, decay: 2.2, mix: 0.42 }
    }
  },
  {
    id: "dream_space",
    name: "Dreamy Echo",
    icon: "🌌",
    desc: "Sphärischer Chorus-Delay",
    settings: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.4, depth: 0.65, mix: 0.6 },
      delay: { active: true, time: 0.55, feedback: 0.6, mix: 0.55 },
      reverb: { active: true, decay: 3.8, mix: 0.52 }
    }
  },
  {
    id: "ambient_surf",
    name: "Surf Spring Room",
    icon: "🌊",
    desc: "Surf Delay & Reverb",
    settings: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 2.5, depth: 0.18, mix: 0.25 },
      delay: { active: true, time: 0.24, feedback: 0.35, mix: 0.4 },
      reverb: { active: true, decay: 2.8, mix: 0.5 }
    }
  }
];

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  suffix?: string;
}

const Knob: React.FC<KnobProps> = ({ label, value, min, max, onChange, suffix = "" }) => {
  const percentage = (value - min) / (max - min);
  const angle = -135 + percentage * 270;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = (max - min) / 40;
    const delta = e.deltaY > 0 ? -step : step;
    const newVal = Math.min(max, Math.max(min, value + delta));
    onChange(Number(newVal.toFixed(2)));
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none cursor-ns-resize" onWheel={handleWheel}>
      <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-[#a89880] truncate w-12 text-center" title={label}>{label}</span>
      <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[#120a04] border border-[#5a4838] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
        {/* Needle pointer */}
        <div 
          className="absolute w-0.5 h-4 bg-[#d4943c] rounded-full origin-bottom"
          style={{
            transform: `rotate(${angle}deg) translateY(-6px)`,
            transition: "transform 0.1s ease-out"
          }}
        />
        {/* Small cap center */}
        <div className="w-3 h-3 rounded-full bg-[#2a1e10] border border-[#d4943c]/40 shadow-xs" />
      </div>
      {/* Fallback micro range slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 30}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-12 h-1 bg-[#120a04] mt-0.5 accent-[#d4943c] cursor-ew-resize rounded-full"
      />
      <span className="text-[8px] font-mono font-bold text-[#d4943c]">
        {Math.round(percentage * 100)}{suffix}
      </span>
    </div>
  );
};

export default function App() {
  const [tab, setTab] = useState<"songwriter" | "theorie" | "tuner" | "pedalboard" | "recorder">("songwriter");
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
  const [drumsVolume, setDrumsVolume] = useState<number>(0.65);
  const [bassVolume, setBassVolume] = useState<number>(0.65);
  const [drumsPitch, setDrumsPitch] = useState<number>(1.0);
  const [bassFilterCutoff, setBassFilterCutoff] = useState<number>(350);
  const [theoryKey, setTheoryKey] = useState<number>(0);
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [whatsAppImportModalOpen, setWhatsAppImportModalOpen] = useState<boolean>(false);
  const [whatsAppImportText, setWhatsAppImportText] = useState<string>("");
  const [whatsAppSongTitle, setWhatsAppSongTitle] = useState<string>("Mein Jam-Preset");
  const [toastMsg, setToastMsg] = useState<string>("");
  const [isFooterMinimized, setIsFooterMinimized] = useState<boolean>(false);
  const [expandedSection, setExpandedSection] = useState<"navigation" | "sequencer" | "instruments" | "style" | "trash" | null>("navigation");

  // Guitar Pedalboard FX State
  const [pedalboard, setPedalboard] = useState({
    overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
    chorus: { active: false, rate: 1.5, depth: 0.35, mix: 0.4 },
    delay: { active: false, time: 0.38, feedback: 0.45, mix: 0.4 },
    reverb: { active: false, decay: 2.2, mix: 0.35 }
  });

  // Sound Recorder State for Timeline Recording Addon
  const [micPermissionError, setMicPermissionError] = useState<boolean>(false);
  const [recordings, setRecordings] = useState<Array<{ id: number; name: string; url: string; buffer: AudioBuffer | null; duration: number }>>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // iOS Style Log-Press Context Menu States
  const [longPressActive, setLongPressActive] = useState<boolean>(false);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    chordData: {
      name: string;
      semitone: number;
      quality: "maj" | "min" | "dim";
      suffix: string;
      roman: string;
    };
  } | null>(null);

  const startLongPress = (
    e: React.PointerEvent<HTMLButtonElement>,
    chordData: { name: string; semitone: number; quality: "maj" | "min" | "dim"; suffix?: string; roman?: string }
  ) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    setLongPressActive(false);

    const timer = setTimeout(() => {
      setLongPressActive(true);
      if (navigator.vibrate) {
        navigator.vibrate(28);
      }
      setContextMenu({
        isOpen: true,
        x: clientX || e.currentTarget.getBoundingClientRect().left + 24,
        y: clientY || e.currentTarget.getBoundingClientRect().top - 12,
        chordData: {
          name: chordData.name,
          semitone: chordData.semitone,
          quality: chordData.quality,
          suffix: chordData.suffix || (chordData.quality === "min" ? "m" : chordData.quality === "dim" ? "dim" : ""),
          roman: chordData.roman || ""
        }
      });
    }, 450);
    setLongPressTimer(timer);
  };

  const endLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleChordClick = (
    e: React.MouseEvent,
    defaultAction: () => void
  ) => {
    if (longPressActive) {
      e.preventDefault();
      e.stopPropagation();
      setLongPressActive(false);
      return;
    }
    defaultAction();
  };

  // Audio nodes and context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const playTimeoutRef = useRef<number | null>(null);
  const timelineRef = useRef<TimelineItem[]>([]);
  const uidRef = useRef<number>(0);

  // Pedalboard Web Audio refs
  const driveNodeRef = useRef<WaveShaperNode | null>(null);
  const driveToneNodeRef = useRef<BiquadFilterNode | null>(null);
  const driveGainNodeRef = useRef<GainNode | null>(null);
  
  const chorusDelayNodeRef = useRef<DelayNode | null>(null);
  const chorusLfoRef = useRef<OscillatorNode | null>(null);
  const chorusLfoGainRef = useRef<GainNode | null>(null);
  const chorusDryGainRef = useRef<GainNode | null>(null);
  const chorusWetGainRef = useRef<GainNode | null>(null);

  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const delayDryRef = useRef<GainNode | null>(null);
  const delayWetRef = useRef<GainNode | null>(null);

  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const reverbDryRef = useRef<GainNode | null>(null);
  const reverbWetRef = useRef<GainNode | null>(null);

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

  // Clean playTimeout and recording intervals on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      stopTuner();
      // stop recording stream if any
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  };

  const applyFxPreset = (presetId: string) => {
    const selected = FX_PRESETS.find(p => p.id === presetId);
    if (selected) {
      initAudio();
      setPedalboard({
        overdrive: { ...selected.settings.overdrive },
        chorus: { ...selected.settings.chorus },
        delay: { ...selected.settings.delay },
        reverb: { ...selected.settings.reverb }
      });
      showToast(`⚡ Rig geladen: ${selected.name}`);
    }
  };

  const makeDistortionCurve = (amount: number) => {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };

  const createReverbImpulse = (ctx: AudioContext, decay: number): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(sampleRate * 0.1, Math.round(sampleRate * decay));
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const percent = i / length;
      const decayEnvelope = Math.pow(1 - percent, 2);
      const valL = (Math.random() * 2 - 1) * decayEnvelope;
      const valR = (Math.random() * 2 - 1) * decayEnvelope;
      left[i] = valL;
      right[i] = valR;
    }
    return impulse;
  };

  const setupEffectsChain = (ctx: AudioContext, masterGain: GainNode) => {
    // 1. Overdrive Nodes
    const shaper = ctx.createWaveShaper();
    const ovFilter = ctx.createBiquadFilter();
    ovFilter.type = "lowpass";
    const ovGain = ctx.createGain();

    // 2. Chorus Nodes
    const choDry = ctx.createGain();
    const choWet = ctx.createGain();
    const choDelay = ctx.createDelay();
    choDelay.delayTime.value = 0.03; // baseline delay 30ms
    const choLfo = ctx.createOscillator();
    choLfo.type = "sine";
    const choLfoGain = ctx.createGain();

    // 3. Delay Nodes
    const delDry = ctx.createGain();
    const delWet = ctx.createGain();
    const delNode = ctx.createDelay(2.0);
    const delFeedback = ctx.createGain();

    // 4. Reverb Nodes
    const revDry = ctx.createGain();
    const revWet = ctx.createGain();
    const revCon = ctx.createConvolver();

    // CONNECT INTEGRATION
    masterGain.disconnect();
    
    // Connect MasterGain to Overdrive Input
    masterGain.connect(shaper);
    shaper.connect(ovFilter);
    ovFilter.connect(ovGain);

    // Overdrive Output to Chorus (Both dry and wet paths)
    ovGain.connect(choDry);
    ovGain.connect(choDelay);
    choDelay.connect(choWet);

    // Chorus LFO setup
    choLfo.connect(choLfoGain);
    choLfoGain.connect(choDelay.delayTime);
    choLfo.start();

    // Chorus Summer Gain
    const choOutput = ctx.createGain();
    choDry.connect(choOutput);
    choWet.connect(choOutput);

    // Chorus Out to Delay (Both dry and wet paths)
    choOutput.connect(delDry);
    choOutput.connect(delNode);
    delNode.connect(delWet);

    // Delay Feedback Loop
    delNode.connect(delFeedback);
    delFeedback.connect(delNode);

    // Delay Summer Gain
    const delOutput = ctx.createGain();
    delDry.connect(delOutput);
    delWet.connect(delOutput);

    // Delay Out to Reverb (Both dry and wet paths)
    delOutput.connect(revDry);
    delOutput.connect(revCon);
    revCon.connect(revWet);

    // Reverb Out to Destination
    const finalOut = ctx.createGain();
    revDry.connect(finalOut);
    revWet.connect(finalOut);
    finalOut.connect(ctx.destination);

    // Store refs
    driveNodeRef.current = shaper;
    driveToneNodeRef.current = ovFilter;
    driveGainNodeRef.current = ovGain;

    chorusDelayNodeRef.current = choDelay;
    chorusLfoRef.current = choLfo;
    chorusLfoGainRef.current = choLfoGain;
    chorusDryGainRef.current = choDry;
    chorusWetGainRef.current = choWet;

    delayNodeRef.current = delNode;
    delayFeedbackRef.current = delFeedback;
    delayDryRef.current = delDry;
    delayWetRef.current = delWet;

    reverbNodeRef.current = revCon;
    reverbDryRef.current = revDry;
    reverbWetRef.current = revWet;

    // Reactively update parameters
    updatePedalboardNodesDirect(ctx);
  };

  const updatePedalboardNodesDirect = (ctx: AudioContext) => {
    // 1. Overdrive
    const shaper = driveNodeRef.current;
    const filter = driveToneNodeRef.current;
    const gainNode = driveGainNodeRef.current;
    if (shaper && filter && gainNode) {
      if (pedalboard.overdrive.active) {
        shaper.curve = makeDistortionCurve(pedalboard.overdrive.drive * 120);
        filter.frequency.setValueAtTime(300 + pedalboard.overdrive.tone * 5700, ctx.currentTime);
        gainNode.gain.setValueAtTime(pedalboard.overdrive.volume, ctx.currentTime);
      } else {
        shaper.curve = null;
        filter.frequency.setValueAtTime(22000, ctx.currentTime);
        gainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      }
    }

    // 2. Chorus
    const choDry = chorusDryGainRef.current;
    const choWet = chorusWetGainRef.current;
    const lfo = chorusLfoRef.current;
    const lfoGain = chorusLfoGainRef.current;
    if (choDry && choWet && lfoGain) {
      if (pedalboard.chorus.active) {
        choDry.gain.setValueAtTime(1.0 - pedalboard.chorus.mix * 0.5, ctx.currentTime);
        choWet.gain.setValueAtTime(pedalboard.chorus.mix * 0.9, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.001 + pedalboard.chorus.depth * 0.0035, ctx.currentTime);
        if (lfo) {
          lfo.frequency.setValueAtTime(0.2 + pedalboard.chorus.rate * 9.8, ctx.currentTime);
        }
      } else {
        choDry.gain.setValueAtTime(1.0, ctx.currentTime);
        choWet.gain.setValueAtTime(0.0, ctx.currentTime);
      }
    }

    // 3. Delay
    const delNode = delayNodeRef.current;
    const delFb = delayFeedbackRef.current;
    const delDry = delayDryRef.current;
    const delWet = delayWetRef.current;
    if (delNode && delFb && delDry && delWet) {
      if (pedalboard.delay.active) {
        delDry.gain.setValueAtTime(1.0, ctx.currentTime);
        delWet.gain.setValueAtTime(pedalboard.delay.mix * 0.85, ctx.currentTime);
        delNode.delayTime.setValueAtTime(0.05 + pedalboard.delay.time * 0.95, ctx.currentTime);
        delFb.gain.setValueAtTime(pedalboard.delay.feedback * 0.75, ctx.currentTime);
      } else {
        delDry.gain.setValueAtTime(1.0, ctx.currentTime);
        delWet.gain.setValueAtTime(0.0, ctx.currentTime);
      }
    }

    // 4. Reverb
    const revCon = reverbNodeRef.current;
    const revDry = reverbDryRef.current;
    const revWet = reverbWetRef.current;
    if (revCon && revDry && revWet) {
      if (pedalboard.reverb.active) {
        revDry.gain.setValueAtTime(1.0, ctx.currentTime);
        revWet.gain.setValueAtTime(pedalboard.reverb.mix * 0.85, ctx.currentTime);
        if (!revCon.buffer) {
          revCon.buffer = createReverbImpulse(ctx, pedalboard.reverb.decay);
        }
      } else {
        revDry.gain.setValueAtTime(1.0, ctx.currentTime);
        revWet.gain.setValueAtTime(0.0, ctx.currentTime);
      }
    }
  };

  const updatePedalboardNodes = () => {
    const ctx = audioContextRef.current;
    if (ctx) {
      updatePedalboardNodesDirect(ctx);
    }
  };

  // Re-generate reverb buffer if decay changes
  useEffect(() => {
    const ctx = audioContextRef.current;
    const revCon = reverbNodeRef.current;
    if (ctx && revCon && pedalboard.reverb.active) {
      try {
        revCon.buffer = createReverbImpulse(ctx, pedalboard.reverb.decay);
      } catch (e) {
        console.warn("Could not hot-swap Reverb buffer", e);
      }
    }
    updatePedalboardNodes();
  }, [pedalboard]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.8;
      audioContextRef.current = ctx;
      masterGainRef.current = gainNode;
      setupEffectsChain(ctx, gainNode);
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
    } else if (currentInst === "guitar_acoustic") {
      const intervals = chordIntervals(q);
      const baseFreq = 130.81;
      intervals.forEach((iv, ni) => {
        [0, 12, 24].forEach((o, oi) => {
          const f = baseFreq * Math.pow(2, (s + iv + o) / 12);
          const dl = pat === "strum" ? ni * 0.038 + oi * 0.008 : pat === "arpeggio" ? ni * 0.12 : 0;
          const t = ctx.currentTime + dl;
          
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const g = ctx.createGain();
          const fl = ctx.createBiquadFilter();
          
          osc1.type = "triangle";
          osc2.type = "sine";
          osc1.frequency.value = f;
          osc2.frequency.value = f * 2.01;
          
          fl.type = "highpass";
          fl.frequency.value = 140;
          
          const v = (oi === 0 ? 0.05 : oi === 1 ? 0.03 : 0.012) / (ni + 1);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(v, t + 0.004);
          g.gain.exponentialRampToValueAtTime(Math.max(v * 0.2, 0.0001), t + 0.18);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          
          osc1.connect(fl);
          osc2.connect(fl);
          fl.connect(g);
          g.connect(masterGain);
          
          osc1.start(t);
          osc1.stop(t + d + 0.05);
          osc2.start(t);
          osc2.stop(t + d + 0.05);
        });
      });
    } else if (currentInst === "guitar_electric_clean") {
      const intervals = chordIntervals(q);
      const baseFreq = 130.81;
      intervals.forEach((iv, ni) => {
        [0, 12].forEach((o, oi) => {
          const f = baseFreq * Math.pow(2, (s + iv + o) / 12);
          const dl = pat === "strum" ? ni * 0.035 : pat === "arpeggio" ? ni * 0.11 : 0;
          const t = ctx.currentTime + dl;
          
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const fl = ctx.createBiquadFilter();
          
          osc.type = oi === 0 ? "sine" : "triangle";
          osc.frequency.value = f;
          
          fl.type = "lowpass";
          fl.frequency.value = 1300;
          
          const v = (oi === 0 ? 0.065 : 0.03) / (ni + 1);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(v, t + 0.008);
          g.gain.exponentialRampToValueAtTime(v * 0.5, t + 0.25);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          
          osc.connect(fl);
          fl.connect(g);
          g.connect(masterGain);
          
          osc.start(t);
          osc.stop(t + d + 0.05);
        });
      });
    } else if (currentInst === "guitar_electric_dist") {
      const intervals = chordIntervals(q);
      const baseFreq = 130.81 - 12;
      intervals.forEach((iv, ni) => {
        [-3, 0, 3].forEach((dt, oi) => {
          const f = baseFreq * Math.pow(2, (s + iv) / 12);
          const dl = pat === "strum" ? ni * 0.025 : pat === "arpeggio" ? ni * 0.09 : 0;
          const t = ctx.currentTime + dl;
          
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const ampFilter = ctx.createBiquadFilter();
          const preGain = ctx.createGain();
          const distNode = ctx.createWaveShaper();
          
          osc.type = "sawtooth";
          osc.frequency.value = f;
          osc.detune.value = dt * 1.8;
          
          ampFilter.type = "peaking";
          ampFilter.frequency.setValueAtTime(2200, t);
          ampFilter.Q.value = 1.2;
          ampFilter.gain.setValueAtTime(8, t);
          
          preGain.gain.setValueAtTime(3.0, t);
          
          distNode.curve = makeDistortionCurve(75);
          distNode.oversample = "4x";
          
          const v = 0.045 / (oi + 1);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(v, t + 0.005);
          g.gain.linearRampToValueAtTime(v * 0.8, t + 0.08);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          
          osc.connect(preGain);
          preGain.connect(distNode);
          distNode.connect(ampFilter);
          ampFilter.connect(g);
          g.connect(masterGain);
          
          osc.start(t);
          osc.stop(t + d + 0.05);
        });
      });
    } else if (currentInst === "sax") {
      const intervals = chordIntervals(q);
      const baseFreq = 261.63 - 12;
      intervals.forEach((iv, ni) => {
        const f = baseFreq * Math.pow(2, (s + iv) / 12);
        const t = ctx.currentTime;
        
        [0.99, 1.0, 1.01].forEach((detuneRate, oi) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const fl = ctx.createBiquadFilter();
          
          osc.type = oi === 1 ? "sawtooth" : "triangle";
          osc.frequency.value = f * detuneRate;
          
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 5.4;
          lfoGain.gain.value = f * 0.012;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(t);
          lfo.stop(t + d + 0.05);
          
          fl.type = "bandpass";
          fl.frequency.setValueAtTime(250, t);
          fl.frequency.exponentialRampToValueAtTime(1500, t + 0.12);
          fl.frequency.exponentialRampToValueAtTime(950, t + d);
          fl.Q.value = 1.3;
          
          let subOsc: OscillatorNode | null = null;
          let subGain: GainNode | null = null;
          if (oi === 1) {
            subOsc = ctx.createOscillator();
            subGain = ctx.createGain();
            subOsc.type = "sine";
            subOsc.frequency.value = f * 0.5;
            subGain.gain.setValueAtTime(0, t);
            subGain.gain.linearRampToValueAtTime(0.012, t + 0.1);
            subGain.gain.exponentialRampToValueAtTime(0.0001, t + d);
            subOsc.connect(subGain);
            subGain.connect(masterGain);
            subOsc.start(t);
            subOsc.stop(t + d + 0.05);
          }
          
          const v = 0.024 / (oi + 1);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(v, t + 0.12);
          g.gain.setValueAtTime(v, t + d - 0.22);
          g.gain.linearRampToValueAtTime(0.0001, t + d);
          
          osc.connect(fl);
          fl.connect(g);
          g.connect(masterGain);
          
          osc.start(t);
          osc.stop(t + d + 0.05);
        });
      });
    } else if (currentInst === "djembe") {
      const intervals = chordIntervals(q);
      const baseFreq = 70;
      intervals.forEach((iv, ni) => {
        const f = baseFreq * Math.pow(2, (s + iv) / 12);
        const dl = pat === "strum" ? ni * 0.07 : pat === "arpeggio" ? ni * 0.13 : 0;
        const t = ctx.currentTime + dl;
        
        const oscThud = ctx.createOscillator();
        const gThud = ctx.createGain();
        oscThud.type = "sine";
        oscThud.frequency.setValueAtTime(f, t);
        oscThud.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.12);
        
        gThud.gain.setValueAtTime(0, t);
        gThud.gain.linearRampToValueAtTime(0.28, t + 0.003);
        gThud.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        
        oscThud.connect(gThud);
        gThud.connect(masterGain);
        oscThud.start(t);
        oscThud.stop(t + 0.3);
        
        const oscSlap = ctx.createOscillator();
        const gSlap = ctx.createGain();
        const noiseGen = ctx.createBufferSource();
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        
        oscSlap.type = "triangle";
        oscSlap.frequency.setValueAtTime(f * 3.8, t);
        oscSlap.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.05);
        
        gSlap.gain.setValueAtTime(0, t);
        gSlap.gain.linearRampToValueAtTime(0.18, t + 0.002);
        gSlap.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        
        const bufferSize = ctx.sampleRate * 0.04;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const outputBuffer = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          outputBuffer[i] = Math.random() * 2 - 1;
        }
        noiseGen.buffer = noiseBuffer;
        
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(2000, t);
        noiseFilter.Q.value = 2.0;
        
        noiseGain.gain.setValueAtTime(0, t);
        noiseGain.gain.linearRampToValueAtTime(0.09, t + 0.001);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        
        noiseGen.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        oscSlap.connect(gSlap);
        gSlap.connect(masterGain);
        
        oscSlap.start(t);
        oscSlap.stop(t + 0.12);
        noiseGen.start(t);
        noiseGen.stop(t + 0.12);
      });
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
    if (drumsVolume <= 0) return;
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150 * drumsPitch, time);
    osc.frequency.exponentialRampToValueAtTime(50 * drumsPitch, time + 0.08);
    g.gain.setValueAtTime(0.55 * drumsVolume, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.3);
  };

  const playSnare = (time: number) => {
    if (drumsVolume <= 0) return;
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer();
    const ng = ctx.createGain();
    const nf = ctx.createBiquadFilter();
    nf.type = "highpass";
    nf.frequency.value = 1200 * drumsPitch;
    ng.gain.setValueAtTime(0.28 * drumsVolume, time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    ns.connect(nf);
    nf.connect(ng);
    ng.connect(masterGain);
    ns.start(time);
    ns.stop(time + 0.18);

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 180 * drumsPitch;
    g.gain.setValueAtTime(0.2 * drumsVolume, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    o.connect(g);
    g.connect(masterGain);
    o.start(time);
    o.stop(time + 0.08);
  };

  const playHihat = (time: number, open = false) => {
    if (drumsVolume <= 0) return;
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = Math.min(19500, 7000 * drumsPitch);
    const d = open ? 0.12 : 0.06;
    g.gain.setValueAtTime((open ? 0.1 : 0.07) * drumsVolume, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + d);
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
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    ns.connect(f);
    f.connect(g);
    g.connect(masterGain);
    ns.start(time);
    ns.stop(time + 0.04);
  };

  const playBassNote = (semi: number, time: number, dur: number) => {
    if (bassVolume <= 0) return;
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
    fl.frequency.value = bassFilterCutoff;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.12 * bassVolume, time + 0.01);
    g.gain.setValueAtTime(0.12 * bassVolume, time + dur - 0.05);
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
    g2.gain.linearRampToValueAtTime(0.08 * bassVolume, time + 0.01);
    g2.gain.setValueAtTime(0.08 * bassVolume, time + dur - 0.05);
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

  // Recording Helper Functions
  const startRecording = async () => {
    initAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionError(false);
      recordedChunksRef.current = [];
      
      let options = {};
      // target common, accessible browser codecs
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        options = { mimeType: "audio/ogg" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      }

      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        
        const arrayBuf = await blob.arrayBuffer();
        const ctx = audioContextRef.current;
        let decodedBuffer: AudioBuffer | null = null;
        if (ctx) {
          try {
            decodedBuffer = await ctx.decodeAudioData(arrayBuf);
          } catch (err) {
            console.error("decodeAudioData failed", err);
          }
        }

        const id = uidRef.current++;
        const recIndex = recordings.length + 1;
        const newRec = {
          id,
          name: `Aufnahme #${recIndex} (${decodedBuffer ? decodedBuffer.duration.toFixed(1) : "2.0"}s)`,
          url,
          buffer: decodedBuffer,
          duration: decodedBuffer ? decodedBuffer.duration : 2.0
        };

        setRecordings((prev) => [...prev, newRec]);
        showToast(`Aufnahme #${recIndex} im Kasten!`);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Could not capture audio stream", err);
      setMicPermissionError(true);
      showToast("Aufnahme fehlgeschlagen. Überprüfe die Mikrofon-Freigabe.");
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    const recorder = mediaRecorderRef.current;
    if (recorder && isRecording) {
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const addRecordingToTimeline = (rec: { name: string; buffer: AudioBuffer | null; url: string; duration: number }) => {
    const newItem: TimelineItem = {
      type: "recording",
      name: rec.name,
      id: uidRef.current++,
      audioBuffer: rec.buffer,
      audioUrl: rec.url,
      duration: rec.duration
    };
    setTimeline((prev) => [...prev, newItem]);
    showToast(`"${rec.name}" zur Timeline hinzugefügt!`);
  };

  const deleteRecording = (id: number) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    showToast("Aufnahme gelöscht");
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
    const capoText = capo > 0 ? `\n🧢 Capo: Bund ${capo}` : "";
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

    // Create a lean package of all audio/arranger configurations
    const dataObj = {
      v: 2,
      title: whatsAppSongTitle || "Mein Jam-Preset",
      bpm,
      currentInst,
      drumsOn,
      basslineOn,
      beatsPerBar,
      strumPattern,
      drumPattern,
      bassPattern,
      drumsVolume,
      bassVolume,
      drumsPitch,
      bassFilterCutoff,
      pedalboard,
      timeline: currentTimeline.map(item => ({
        type: item.type,
        name: item.name,
        semitone: item.semitone,
        quality: item.quality,
        suffix: item.suffix,
        roman: item.roman,
        id: item.id,
        duration: item.duration
      }))
    };

    let base64Code = "";
    try {
      const jsonStr = JSON.stringify(dataObj);
      base64Code = btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (e) {
      console.error("Fehler beim Serialisieren der Teilen-Daten:", e);
    }

    const importSection = base64Code 
      ? `\n\n📲 *Schnell-Import (Diesen GESAMTEN Text kopieren und in der App unter "WhatsApp-Import" einfügen!)*\n--- CHORDS_IMPORT_DATA_START ---\n${base64Code}\n--- CHORDS_IMPORT_DATA_END ---`
      : "";

    return `🎸 _Arrangement: *${whatsAppSongTitle}*_\n━━━━━━━━━━━━━━━━━━━━\n🎵 Tonart: ${keyName}${capoText}\n⏱ Tempo: ${bpm} BPM | ⏰ ${beatsPerBar}/4 Takt | 🪕 Style: ${strumPattern}\n━━━━━━━━━━━━━━━━━━━━\n${parts.join("\n")}\n━━━━━━━━━━━━━━━━━━━━\n🤘 Erstellt mit der Akkord-App!${importSection}`;
  };

  const copyProgression = () => {
    const text = generateExportText();
    if (!text) {
      showToast("Die Timeline ist leer");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Akkordfolge & Import-Code kopiert!"))
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

  const importFromWhatsApp = (text: string) => {
    if (!text || !text.trim()) {
      showToast("Bitte füge zuerst einen Text ein!");
      return;
    }

    const regex = /--- CHORDS_IMPORT_DATA_START ---\s*([\s\S]*?)\s*--- CHORDS_IMPORT_DATA_END ---/;
    const match = text.match(regex);
    let finalCode = "";
    
    if (match) {
      finalCode = match[1].trim();
    } else {
      // Fallback: If copy was partial or just the raw base64 string
      finalCode = text.trim();
    }

    try {
      const jsonStr = decodeURIComponent(escape(atob(finalCode)));
      const imported = JSON.parse(jsonStr);

      if (imported.timeline && Array.isArray(imported.timeline)) {
        // Stop playing to transition safely
        stopPlay();
        
        // Load chords
        setTimeline(imported.timeline);
        
        // Restore all music configs
        if (typeof imported.bpm === "number") setBpm(imported.bpm);
        if (typeof imported.currentInst === "string") setCurrentInst(imported.currentInst);
        if (typeof imported.drumsOn === "boolean") setDrumsOn(imported.drumsOn);
        if (typeof imported.basslineOn === "boolean") setBasslineOn(imported.basslineOn);
        if (imported.beatsPerBar === 3 || imported.beatsPerBar === 4) setBeatsPerBar(imported.beatsPerBar);
        if (typeof imported.strumPattern === "string") setStrumPattern(imported.strumPattern as any);
        if (typeof imported.drumPattern === "string") setDrumPattern(imported.drumPattern);
        if (typeof imported.bassPattern === "string") setBassPattern(imported.bassPattern);
        if (typeof imported.drumsVolume === "number") setDrumsVolume(imported.drumsVolume);
        if (typeof imported.bassVolume === "number") setBassVolume(imported.bassVolume);
        if (typeof imported.drumsPitch === "number") setDrumsPitch(imported.drumsPitch);
        if (typeof imported.bassFilterCutoff === "number") setBassFilterCutoff(imported.bassFilterCutoff);
        
        if (imported.pedalboard) {
          setPedalboard({
            overdrive: { ...pedalboard.overdrive, ...imported.pedalboard.overdrive },
            chorus: { ...pedalboard.chorus, ...imported.pedalboard.chorus },
            delay: { ...pedalboard.delay, ...imported.pedalboard.delay },
            reverb: { ...pedalboard.reverb, ...imported.pedalboard.reverb }
          });
        }
        
        if (imported.title) {
          setWhatsAppSongTitle(imported.title);
        }

        showToast(`🎉 "${imported.title || "Geteilter Song"}" erfolgreich geladen!`);
        setWhatsAppImportModalOpen(false);
        setWhatsAppImportText("");
      } else {
        showToast("❌ Ungültiger Import-Datenblock.");
      }
    } catch (e) {
      showToast("❌ Import fehlgeschlagen. Überprüfe den Text.");
    }
  };

  // Playback Loop Engine
  const startPlay = () => {
    const currentTimeline = timelineRef.current;
    if (!currentTimeline.length) {
      showToast("Die Timeline ist leer. Füge Akkorde oder Aufnahmen hinzu.");
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

    if (item.type === "recording") {
      if (item.audioBuffer) {
        const ctx = audioContextRef.current;
        const masterGain = masterGainRef.current;
        if (ctx && masterGain) {
          const source = ctx.createBufferSource();
          source.buffer = item.audioBuffer;
          source.connect(masterGain);
          source.start(now);
        }
      } else if (item.audioUrl) {
        const audio = new Audio(item.audioUrl);
        audio.volume = 0.8;
        audio.play().catch((e) => console.warn("Fallback playback failed:", e));
      }

      const recDur = Math.max(0.5, item.duration ?? barDur);
      playTimeoutRef.current = setTimeout(() => {
        setPlayIdx((prev) => (prev + 1) >= currentTimeline.length ? 0 : prev + 1);
      }, recDur * 1000) as any;
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

    // Apply progression-specific presets
    if (p.bpm) {
      setBpm(p.bpm);
    }
    if (p.strumPattern) {
      setStrumPattern(p.strumPattern);
    }
    if (p.drumPattern) {
      setDrumPattern(p.drumPattern);
    }
    if (p.bassPattern) {
      setBassPattern(p.bassPattern);
    }
    if (p.currentInst) {
      setCurrentInst(p.currentInst);
    }
    if (p.pedalboard) {
      setPedalboard({
        overdrive: { ...pedalboard.overdrive, ...p.pedalboard.overdrive, active: p.pedalboard.overdrive?.active ?? false },
        chorus: { ...pedalboard.chorus, ...p.pedalboard.chorus, active: p.pedalboard.chorus?.active ?? false },
        delay: { ...pedalboard.delay, ...p.pedalboard.delay, active: p.pedalboard.delay?.active ?? false },
        reverb: { ...pedalboard.reverb, ...p.pedalboard.reverb, active: p.pedalboard.reverb?.active ?? false }
      });
    }

    setTab("songwriter");
    const styleLabel = p.strumPattern === "strum" ? "Zupfen" : p.strumPattern === "arpeggio" ? "Arpeggio" : "Block";
    const extraInfo = p.bpm ? ` (${p.bpm} BPM, ${styleLabel})` : "";
    showToast(`${p.name} geladen!${extraInfo}`);
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
      setMicPermissionError(false);
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
      setMicPermissionError(true);
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

  const changeTab = (newTab: "songwriter" | "theorie" | "tuner" | "pedalboard" | "recorder") => {
    if (newTab !== "tuner") {
      stopTuner();
    }
    if (newTab !== "recorder" && isRecording) {
      stopRecording();
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
        <div className="sticky top-0 z-50 bg-[#1a1008]/95 backdrop-blur-md py-3.5 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-[#4a3828]/45 mb-8 flex justify-center overflow-x-auto w-full scrollbar-none shadow-md">
          <div className="relative flex rounded-2xl bg-[#120a04]/95 p-1 border border-[#4a3828]/60 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md select-none shrink-0 gap-1 md:gap-0">
            {[
              { id: "songwriter" as const, label: "Songwriter", icon: <Guitar size={15} /> },
              { id: "theorie" as const, label: "Theorie", icon: <BookOpen size={15} /> },
              { id: "tuner" as const, label: "Stimmgerät", icon: <Mic size={15} /> },
              { id: "pedalboard" as const, label: "Pedalboard", icon: <SlidersHorizontal size={15} /> },
              { id: "recorder" as const, label: "Aufnahme", icon: <Volume2 size={15} /> }
            ].map((item) => {
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => changeTab(item.id)}
                  className={`relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2.5 sm:px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] sm:text-xs md:text-sm font-black tracking-wide uppercase transition-all duration-300 cursor-pointer z-10 ${
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
                  <span className="inline-block text-[9px] sm:text-[11px] md:text-xs font-mono font-black">{item.label}</span>
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
                        onPointerDown={(e) => startLongPress(e, { name: CO5_MAJ[i], semitone: semi, quality: "maj", suffix: "", roman: "I" })}
                        onPointerUp={endLongPress}
                        onPointerLeave={endLongPress}
                        onClick={(e) => {
                          handleChordClick(e, () => {
                            setSelKeyIdx(i);
                            addChordToTimeline(CO5_MAJ[i], semi, "maj");
                          });
                        }}
                        className={`absolute w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-bold transition-all transform cursor-pointer -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95 z-20 ${borderStyles}`}
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
                        onPointerDown={(e) => startLongPress(e, { name: CO5_MIN[i], semitone: minS, quality: "min", suffix: "m", roman: "vi" })}
                        onPointerUp={endLongPress}
                        onPointerLeave={endLongPress}
                        onClick={(e) => {
                          handleChordClick(e, () => {
                            setSelKeyIdx(i);
                            addChordToTimeline(CO5_MIN[i], minS, "min");
                          });
                        }}
                        className={`absolute w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all transform cursor-pointer -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95 z-20 ${borderStyles}`}
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
                          onPointerDown={(e) => startLongPress(e, { name: ch.name, semitone: ch.semitone, quality: ch.quality, suffix: ch.suffix, roman: ch.roman })}
                          onPointerUp={endLongPress}
                          onPointerLeave={endLongPress}
                          onClick={(e) => {
                            handleChordClick(e, () => {
                              addChordToTimeline(ch.name, ch.semitone, ch.quality);
                            });
                          }}
                          className="bg-[#1a1008] border border-[#4a3828] hover:border-[#d4943c] hover:bg-[#2a1e10] p-2.5 rounded-xl transition-all cursor-pointer text-center group active:scale-95"
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
                                  className="text-[9px] font-bold bg-[#6fc888]/10 hover:bg-[#6fc888] text-[#6fc888] hover:text-[#1a1008] px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  + Hinzufügen
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
                                  className="text-[9px] font-bold bg-[#6fc888]/10 hover:bg-[#6fc888] text-[#6fc888] hover:text-[#1a1008] px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  + Hinzufügen
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

                        {/* Preset Badges for tempo, style, patterns */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2 mt-1">
                          {p.bpm && (
                            <span className="text-[10px] bg-[#2a1e10] border border-[#4a3828] px-2 py-0.5 rounded-md text-[#d4943c] font-mono flex items-center gap-1" title="Preset BPM">
                              ⏱️ {p.bpm} BPM
                            </span>
                          )}
                          {p.currentInst && (
                            <span className="text-[10px] bg-[#2a1e10] border border-[#4a3828] px-2 py-0.5 rounded-md text-[#c8b8a4] flex items-center gap-1" title="Preset Instrument">
                              🎸 {p.currentInst === "piano" ? "Klavier" : p.currentInst === "guitar" ? "Akustik Git." : p.currentInst === "guitar_acoustic" ? "Western Git." : p.currentInst === "guitar_electric_clean" ? "E-Gitarre Clean" : p.currentInst === "guitar_electric_dist" ? "E-Gitarre Dist" : p.currentInst === "strings" ? "Streicher" : "Synthesizer"}
                            </span>
                          )}
                          {p.strumPattern && (
                            <span className="text-[10px] bg-[#2a1e10] border border-[#4a3828] px-2 py-0.5 rounded-md text-[#c8b8a4] flex items-center gap-1" title="Preset Begleitung">
                              🎶 {p.strumPattern === "strum" ? "Zupfen" : p.strumPattern === "arpeggio" ? "Arpeggio" : "Blockakkorde"}
                            </span>
                          )}
                          {p.drumPattern && p.drumPattern !== "standard" && (
                            <span className="text-[10px] bg-[#2a1e10] border border-[#4a3828] px-2 py-0.5 rounded-md text-[#c8b8a4] flex items-center gap-1" title="Preset Drum Beat">
                              🥁 {p.drumPattern === "rock" ? "Rockbeat" : p.drumPattern === "funk" ? "Funk Groove" : p.drumPattern === "trap" ? "Trap Rhythm" : p.drumPattern === "latin" ? "Bossa Rhythm" : p.drumPattern}
                            </span>
                          )}
                          {p.bassPattern && p.bassPattern !== "root" && (
                            <span className="text-[10px] bg-[#2a1e10] border border-[#4a3828] px-2 py-0.5 rounded-md text-[#c8b8a4] flex items-center gap-1" title="Preset Basslauf">
                              ⚡ Bass: {p.bassPattern === "walk" ? "Walking" : p.bassPattern === "melodic" ? "Melodic" : p.bassPattern === "syncopated" ? "Syncopated" : p.bassPattern === "octave" ? "Octave" : p.bassPattern}
                            </span>
                          )}
                        </div>

                        {/* Preset Pedalboard FX active lights */}
                        {p.pedalboard && (
                          <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] text-[#7a6a58] bg-[#120a05] px-2 py-1 rounded-lg border border-[#4a3828]/40 w-fit">
                            <span className="font-semibold text-[#8a7a68]">Presets:</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.overdrive?.active ? 'text-[#e85c33] bg-[#e85c33]/15 font-bold border border-[#e85c33]/20' : 'opacity-25'}`}>⚡ OD</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.chorus?.active ? 'text-[#3393e8] bg-[#3393e8]/15 font-bold border border-[#3393e8]/20' : 'opacity-25'}`}>🌀 Cho</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.delay?.active ? 'text-[#33e8a3] bg-[#33e8a3]/15 font-bold border border-[#33e8a3]/20' : 'opacity-25'}`}>⏳ Dly</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.reverb?.active ? 'text-[#a333e8] bg-[#a333e8]/15 font-bold border border-[#a333e8]/20' : 'opacity-25'}`}>🌌 Rev</span>
                          </div>
                        )}

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
              {micPermissionError && (
                <div className="mb-4 text-left p-4 rounded-2xl bg-[#b84a32]/10 border border-[#b84a32]/40 text-xs text-[#f0e0cc] shadow-md">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base text-red-400">⚠️</span>
                    <div>
                      <p className="font-extrabold text-red-400 mb-1">Mikrofon-Zugriff blockiert</p>
                      <p className="leading-relaxed opacity-95 mb-3">
                        Da diese Web-App in einem eingebetteten Vorschau-Fenster (Iframe) läuft, blockiert dein Browser möglicherweise den Zugriff auf dein Mikrofon.
                      </p>
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl bg-[#b84a32] text-white hover:bg-[#b84a32]/90 transition-all font-mono uppercase text-[9px] tracking-wider no-underline"
                      >
                        🚀 In neuem Tab öffnen
                      </a>
                    </div>
                  </div>
                </div>
              )}

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

          {tab === "pedalboard" && (
            <motion.div
              key="pedalboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {/* Board Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-[#25180f] border border-[#4a3828] rounded-t-2xl px-6 py-4 gap-2 shadow-lg">
                <div>
                  <h3 className="text-xl font-serif font-black text-[#d4943c] tracking-tight">Analog Switcher & FX Board</h3>
                  <p className="text-[10px] text-[#a89880] font-mono uppercase tracking-wider">Moduliere deine Akkorde & Recording-Spuren durch Web Audio DSP-Pedale</p>
                </div>
                <div className="flex gap-2 text-xs font-bold text-[#c8b8a4] bg-[#120a04] px-4 py-1.5 rounded-lg border border-[#4a3828]/50">
                  <span className="flex items-center gap-1.5"><Sliders size={12} className="text-[#a89880]" /> 4-Pedal DaisyChain</span>
                </div>
              </div>

              {/* Mobile-Friendly Quick Presets Selector Bar */}
              <div className="bg-[#1c110a] border-x border-[#4a3828] border-b-0 p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="text-xs font-mono font-bold text-[#a89880] uppercase tracking-wider flex items-center gap-1.5">
                    🎛️ Quick Mobile FX Rig/Preset:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                  {FX_PRESETS.map((p) => {
                    const isCurrent = (
                      pedalboard.overdrive.active === p.settings.overdrive.active &&
                      pedalboard.chorus.active === p.settings.chorus.active &&
                      pedalboard.delay.active === p.settings.delay.active &&
                      pedalboard.reverb.active === p.settings.reverb.active
                    );
                    return (
                      <button
                        key={p.id}
                        onClick={() => applyFxPreset(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap ${
                          isCurrent 
                            ? "bg-[#d4943c] text-[#1a1008] border border-[#d4943c]"
                            : "bg-[#120a04] border border-[#4a3828] text-[#a89880] hover:text-[#f0e0cc] hover:border-[#d4943c]"
                        }`}
                        title={p.desc}
                      >
                        <span className="text-[13px]">{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daisy Chain Pedals Floor Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-[#120a04]/90 border-x border-b border-[#4a3828] rounded-b-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                
                {/* PEDAL 1: OVERDRIVE */}
                <div 
                  className={`flex flex-col justify-between rounded-xl bg-gradient-to-b from-[#b45309] to-[#78350f] border-2 transition-all p-4 duration-300 relative shadow-[0_15px_30px_rgba(0,0,0,0.6)] ${
                    pedalboard.overdrive.active ? "border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.25)]" : "border-[#4a3828] grayscale-[30%] opacity-85"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] bg-black/40 text-[#f0e0cc] px-2 py-0.5 rounded font-mono uppercase tracking-widest">DRIVE-01</span>
                    {/* Glowing active LED */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-white/65">STATUS</span>
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${pedalboard.overdrive.active ? "bg-red-500 shadow-[0_0_12px_#ef4444]" : "bg-red-900 border border-black/40"}`} />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="text-lg font-serif font-black tracking-tighter uppercase text-yellow-105">Overdrive</h4>
                    <p className="text-[8px] tracking-wide text-amber-200/60 font-mono -mt-1 uppercase">Warm Analog Distortion</p>
                  </div>

                  {/* Knobs */}
                  <div className="grid grid-cols-3 gap-2 mb-6 bg-black/35 rounded-lg p-2 border border-white/5">
                    <Knob 
                      label="Gain" 
                      value={pedalboard.overdrive.drive} 
                      min={0.1} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, overdrive: { ...prev.overdrive, drive: v } }))} 
                    />
                    <Knob 
                      label="Tone" 
                      value={pedalboard.overdrive.tone} 
                      min={0.1} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, overdrive: { ...prev.overdrive, tone: v } }))} 
                    />
                    <Knob 
                      label="Vol" 
                      value={pedalboard.overdrive.volume} 
                      min={0.1} 
                      max={1.5} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, overdrive: { ...prev.overdrive, volume: v } }))} 
                    />
                  </div>

                  {/* Metal Stomp switch */}
                  <div className="flex flex-col items-center mt-auto">
                    <button 
                      onClick={() => {
                        initAudio();
                        setPedalboard(prev => ({ ...prev, overdrive: { ...prev.overdrive, active: !prev.overdrive.active } }));
                      }}
                      className="w-12 h-12 rounded-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 border-4 border-gray-600 shadow-[0_6px_0_#4b5563,0_10px_20px_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#4b5563,0_4px_10px_rgba(0,0,0,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold text-gray-800 text-xs"
                      title="Stomp Switch"
                    >
                      🔘
                    </button>
                    <span className="text-[9px] font-bold text-yellow-100 mt-2 tracking-widest uppercase">STOMP DRIVE</span>
                  </div>
                </div>

                {/* PEDAL 2: ANALOG CHORUS */}
                <div 
                  className={`flex flex-col justify-between rounded-xl bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] border-2 transition-all p-4 duration-300 relative shadow-[0_15px_30px_rgba(0,0,0,0.6)] ${
                    pedalboard.chorus.active ? "border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.25)]" : "border-[#4a3828] grayscale-[30%] opacity-85"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] bg-black/40 text-[#f0e0cc] px-2 py-0.5 rounded font-mono uppercase tracking-widest">CHO-02</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-white/65">STATUS</span>
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${pedalboard.chorus.active ? "bg-cyan-400 shadow-[0_0_12px_#22d3ee]" : "bg-cyan-900 border border-black/40"}`} />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="text-lg font-serif font-black tracking-tighter uppercase text-cyan-100">Chorus</h4>
                    <p className="text-[8px] tracking-wide text-cyan-200/60 font-mono -mt-1 uppercase">Warm Stereo Width</p>
                  </div>

                  {/* Knobs */}
                  <div className="grid grid-cols-3 gap-2 mb-6 bg-black/35 rounded-lg p-2 border border-white/5">
                    <Knob 
                      label="Rate" 
                      value={pedalboard.chorus.rate} 
                      min={0.1} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, chorus: { ...prev.chorus, rate: v } }))} 
                    />
                    <Knob 
                      label="Depth" 
                      value={pedalboard.chorus.depth} 
                      min={0.1} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, chorus: { ...prev.chorus, depth: v } }))} 
                    />
                    <Knob 
                      label="Mix" 
                      value={pedalboard.chorus.mix} 
                      min={0.0} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, chorus: { ...prev.chorus, mix: v } }))} 
                    />
                  </div>

                  {/* Metal Stomp switch */}
                  <div className="flex flex-col items-center mt-auto">
                    <button 
                      onClick={() => {
                        initAudio();
                        setPedalboard(prev => ({ ...prev, chorus: { ...prev.chorus, active: !prev.chorus.active } }));
                      }}
                      className="w-12 h-12 rounded-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 border-4 border-gray-600 shadow-[0_6px_0_#4b5563,0_10px_20px_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#4b5563,0_4px_10px_rgba(0,0,0,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold text-gray-800 text-xs"
                      title="Stomp Switch"
                    >
                      🔘
                    </button>
                    <span className="text-[9px] font-bold text-cyan-100 mt-2 tracking-widest uppercase">STOMP CHORUS</span>
                  </div>
                </div>

                {/* PEDAL 3: DISK ECHO (DELAY) */}
                <div 
                  className={`flex flex-col justify-between rounded-xl bg-gradient-to-b from-[#047857] to-[#064e3b] border-2 transition-all p-4 duration-300 relative shadow-[0_15px_30px_rgba(0,0,0,0.6)] ${
                    pedalboard.delay.active ? "border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.25)]" : "border-[#4a3828] grayscale-[30%] opacity-85"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] bg-black/40 text-[#f0e0cc] px-2 py-0.5 rounded font-mono uppercase tracking-widest">DEL-03</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-white/65">STATUS</span>
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${pedalboard.delay.active ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-emerald-900 border border-black/40"}`} />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="text-lg font-serif font-black tracking-tighter uppercase text-emerald-100">Delay</h4>
                    <p className="text-[8px] tracking-wide text-emerald-200/60 font-mono -mt-1 uppercase">Analog Tape Echo</p>
                  </div>

                  {/* Knobs */}
                  <div className="grid grid-cols-3 gap-2 mb-6 bg-black/35 rounded-lg p-2 border border-white/5">
                    <Knob 
                      label="Time" 
                      value={pedalboard.delay.time} 
                      min={0.1} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, delay: { ...prev.delay, time: v } }))} 
                    />
                    <Knob 
                      label="Feedb" 
                      value={pedalboard.delay.feedback} 
                      min={0.1} 
                      max={0.9} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, delay: { ...prev.delay, feedback: v } }))} 
                    />
                    <Knob 
                      label="Mix" 
                      value={pedalboard.delay.mix} 
                      min={0.0} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, delay: { ...prev.delay, mix: v } }))} 
                    />
                  </div>

                  {/* Metal Stomp switch */}
                  <div className="flex flex-col items-center mt-auto">
                    <button 
                      onClick={() => {
                        initAudio();
                        setPedalboard(prev => ({ ...prev, delay: { ...prev.delay, active: !prev.delay.active } }));
                      }}
                      className="w-12 h-12 rounded-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 border-4 border-gray-600 shadow-[0_6px_0_#4b5563,0_10px_20px_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#4b5563,0_4px_10px_rgba(0,0,0,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold text-gray-800 text-xs"
                      title="Stomp Switch"
                    >
                      🔘
                    </button>
                    <span className="text-[9px] font-bold text-emerald-100 mt-2 tracking-widest uppercase">STOMP DELAY</span>
                  </div>
                </div>

                {/* PEDAL 4: GALAXY REVERB */}
                <div 
                  className={`flex flex-col justify-between rounded-xl bg-gradient-to-b from-[#6b21a8] to-[#4c1d95] border-2 transition-all p-4 duration-300 relative shadow-[0_15px_30px_rgba(0,0,0,0.6)] ${
                    pedalboard.reverb.active ? "border-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.25)]" : "border-[#4a3828] grayscale-[30%] opacity-85"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] bg-black/40 text-[#f0e0cc] px-2 py-0.5 rounded font-mono uppercase tracking-widest">REV-04</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-white/65">STATUS</span>
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${pedalboard.reverb.active ? "bg-purple-400 shadow-[0_0_12px_#c084fc]" : "bg-purple-900 border border-black/40"}`} />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="text-lg font-serif font-black tracking-tighter uppercase text-purple-100">Reverb</h4>
                    <p className="text-[8px] tracking-wide text-purple-200/60 font-mono -mt-1 uppercase">Ambient Space Room</p>
                  </div>

                  {/* Knobs */}
                  <div className="grid grid-cols-2 gap-2 mb-6 bg-black/35 rounded-lg p-2 border border-white/5">
                    <Knob 
                      label="Decay" 
                      value={pedalboard.reverb.decay} 
                      min={0.5} 
                      max={4.5} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, reverb: { ...prev.reverb, decay: v } }))} 
                    />
                    <Knob 
                      label="Mix" 
                      value={pedalboard.reverb.mix} 
                      min={0.0} 
                      max={1.0} 
                      onChange={(v) => setPedalboard(prev => ({ ...prev, reverb: { ...prev.reverb, mix: v } }))} 
                    />
                  </div>

                  {/* Metal Stomp switch */}
                  <div className="flex flex-col items-center mt-auto">
                    <button 
                      onClick={() => {
                        initAudio();
                        setPedalboard(prev => ({ ...prev, reverb: { ...prev.reverb, active: !prev.reverb.active } }));
                      }}
                      className="w-12 h-12 rounded-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 border-4 border-gray-600 shadow-[0_6px_0_#4b5563,0_10px_20px_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#4b5563,0_4px_10px_rgba(0,0,0,0.4)] transition-all cursor-pointer flex items-center justify-center font-bold text-gray-800 text-xs"
                      title="Stomp Switch"
                    >
                      🔘
                    </button>
                    <span className="text-[9px] font-bold text-purple-100 mt-2 tracking-widest uppercase">STOMP REVERB</span>
                  </div>
                </div>

              </div>
              <div className="text-right text-[10px] text-[#7a6a58] font-mono mt-2 uppercase tracking-wide">
                🎸 *Alle Signale (Klavier, Gitarre, Akkorde, mikrofonaufnahmen) fließen direkt durch diese Effekte!
              </div>
            </motion.div>
          )}

          {tab === "recorder" && (
            <motion.div
              key="recorder"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto"
            >
              {micPermissionError && (
                <div className="mb-4 text-left p-4 rounded-2xl bg-[#b84a32]/10 border border-[#b84a32]/40 text-xs text-[#f0e0cc] shadow-md">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base text-red-400">⚠️</span>
                    <div>
                      <p className="font-extrabold text-red-400 mb-1">Mikrofon-Zugriff blockiert</p>
                      <p className="leading-relaxed opacity-95 mb-3">
                        Da diese Web-App in einem eingebetteten Vorschau-Fenster (Iframe) läuft, blockiert dein Browser möglicherweise den Zugriff auf dein Mikrofon.
                      </p>
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl bg-[#b84a32] text-white hover:bg-[#b84a32]/90 transition-all font-mono uppercase text-[9px] tracking-wider no-underline"
                      >
                        🚀 In neuem Tab öffnen
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-[#2a1e10] border border-[#4a3828] p-6 shadow-xl text-center relative overflow-hidden">
                {/* Visual cassette tape wheels */}
                <div className="flex justify-center items-center gap-6 mb-8 bg-[#120a04] rounded-2xl p-6 border border-[#4a3828]/55 shadow-inner relative">
                  
                  {/* Cassette Left Reel */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3d2b1a] to-[#120a04] border-4 border-[#7a6a58]/40 shadow-xl flex items-center justify-center relative overflow-hidden">
                    <motion.div 
                      className="w-14 h-14 rounded-full border border-dashed border-[#d4943c] flex items-center justify-center"
                      animate={isRecording ? { rotate: 360 } : {}}
                      transition={isRecording ? { repeat: Infinity, duration: 4.8, ease: "linear" } : {}}
                    >
                      <span className="text-[10px] text-[#7a6a58]">⚙️</span>
                    </motion.div>
                    <div className="absolute w-3 h-3 rounded-full bg-[#120a04] border border-[#d4943c] z-10" />
                  </div>

                  {/* Cassette Tape window showing "TAPE LEVEL" */}
                  <div className="flex flex-col items-center bg-[#1a1008] border border-[#4a3828]/60 px-4 py-2 rounded-lg">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#a89880] mb-1">RECORDING METER</span>
                    {/* Glowing LED segments */}
                    <div className="flex gap-0.5 h-3 items-end">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const glowing = isRecording && (recordingSeconds % 4 >= i % 4);
                        return (
                          <div 
                            key={i} 
                            className={`w-1.5 transition-all duration-150 rounded-sm ${
                              glowing 
                                ? i > 9 
                                  ? "h-3 bg-red-500 shadow-[0_0_8px_red]" 
                                  : i > 6 
                                    ? "h-2.5 bg-yellow-400 shadow-[0_0_8px_yellow]" 
                                    : "h-2 bg-green-500 shadow-[0_0_8px_green]"
                                : "h-1 bg-[#1a1008] border border-stone-850"
                            }`} 
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-[#d4943c] font-mono mt-2 font-bold select-none">
                      {isRecording ? `REC ${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, "0")}` : "00:00"}
                    </span>
                  </div>

                  {/* Cassette Right Reel */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3d2b1a] to-[#120a04] border-4 border-[#7a6a58]/40 shadow-xl flex items-center justify-center relative overflow-hidden">
                    <motion.div 
                      className="w-14 h-14 rounded-full border border-dashed border-[#d4943c] flex items-center justify-center"
                      animate={isRecording ? { rotate: 360 } : {}}
                      transition={isRecording ? { repeat: Infinity, duration: 4.8, ease: "linear" } : {}}
                    >
                      <span className="text-[10px] text-[#7a6a58]">⚙️</span>
                    </motion.div>
                    <div className="absolute w-3 h-3 rounded-full bg-[#120a04] border border-[#d4943c] z-10" />
                  </div>

                </div>

                {/* Recorder Control interface */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-serif font-black text-[#f0e0cc] tracking-tight">Vocal- & Mic-Aufnahmegerät</h3>
                  <p className="text-xs text-[#a89880] -mt-2">Singe deine Vocals, nehme dein Klatschen oder dein analoges Instrument auf, um es in der Timeline zu nutzen</p>
                  
                  <div className="flex justify-center gap-4 my-2">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="py-3 px-8 bg-[#b84a32] hover:bg-[#b84a32]/90 text-white rounded-xl text-xs font-black tracking-widest uppercase cursor-pointer transition-all flex items-center gap-2 border-0 shadow-lg"
                      >
                        <span className="w-3.5 h-3.5 bg-white rounded-full animate-ping" /> Aufnahme starten
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="py-3 px-8 bg-[#120a04] text-[#d4943c] hover:bg-[#120a04]/60 rounded-xl text-xs font-black tracking-widest uppercase cursor-pointer transition-all flex items-center gap-2 border border-[#d4943c] shadow-lg animate-pulse"
                      >
                        <Square size={13} fill="currentColor" /> Aufnahme stoppen
                      </button>
                    )}
                  </div>
                </div>

                {/* Captured clips catalog */}
                <div className="mt-8 border-t border-[#4a3828]/40 pt-6 text-left">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#a89880] mb-4">Aufgenommene Clips ({recordings.length})</h4>
                  {recordings.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-[#120a04]/40 border border-dashed border-[#5a4838]/60 rounded-xl text-xs text-[#a89880]">
                      Noch keine Audiodateien vorhanden. Starte eine Aufnahme mit dem Mikrofon!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-52 overflow-y-auto w-full pr-1.5">
                      {recordings.map((rec) => (
                        <div 
                          key={rec.id} 
                          className="flex items-center justify-between bg-[#120a04] hover:bg-[#120a04]/80 p-3 rounded-xl border border-[#4a3828]/40 transition-all gap-2"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Volume2 size={14} className="text-[#d4943c] shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-black text-[#f0e0cc] truncate">{rec.name}</p>
                              <p className="text-[9px] text-[#a89880] font-mono">Dauer: {rec.duration.toFixed(2)} Sek.</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <audio src={rec.url} controls className="hidden" id={`rec-aud-${rec.id}`} />
                            <button
                              onClick={() => {
                                if (rec.buffer) {
                                  initAudio();
                                  const ctx = audioContextRef.current;
                                  const masterGain = masterGainRef.current;
                                  if (ctx && masterGain) {
                                    const source = ctx.createBufferSource();
                                    source.buffer = rec.buffer;
                                    source.connect(masterGain);
                                    source.start(ctx.currentTime);
                                    showToast("Wiedergabe durch Pedal-DSP-Board!");
                                  }
                                } else {
                                  const aud = document.getElementById(`rec-aud-${rec.id}`) as HTMLAudioElement;
                                  if (aud) {
                                    aud.currentTime = 0;
                                    aud.play().catch(() => {});
                                  }
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-[#d4943c]/10 text-[#d4943c] hover:bg-[#d4943c] hover:text-[#1a1008] rounded transition-all cursor-pointer"
                            >
                              Anhören
                            </button>
                            <button
                              onClick={() => addRecordingToTimeline(rec)}
                              title="An Timeline anfügen"
                              className="px-2.5 py-1 text-[10px] font-bold bg-[#d4943c] text-neutral-900 border border-[#d4943c] hover:bg-[#f3a83c] rounded transition-all cursor-pointer flex items-center gap-1"
                            >
                              + An Arranger
                            </button>
                            <button
                              onClick={() => deleteRecording(rec.id)}
                              className="p-1 px-1.5 text-xs text-red-400 hover:text-white hover:bg-red-950 rounded transition-all cursor-pointer border-0 bg-transparent"
                              title="Aufnahme löschen"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Audio Rack Controller Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#2a1e10] border-t-2 border-[#4a3828] z-40 select-none shadow-[0_-12px_35px_rgba(0,0,0,0.95)] pb-4 md:pb-6 transition-all duration-300">
        {/* Full-width elegant click-to-minimize console title bar */}
        <div 
          onClick={() => setIsFooterMinimized(!isFooterMinimized)}
          className="bg-[#1a1008] border-b border-[#4a3828] px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#22160d] transition-all"
          title="Klicken, um die Konsole zu minimieren/maximieren"
        >
          {/* Mock Console Windows Control Dots on Left */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsFooterMinimized(true)}
              className="w-3 h-3 rounded-full bg-[#b84a32] hover:bg-red-400 active:scale-95 transition-all outline-none border-0 cursor-pointer" 
              title="Minimieren"
            />
            <button 
              onClick={() => setIsFooterMinimized(true)}
              className="w-3 h-3 rounded-full bg-[#d4943c] hover:bg-yellow-400 active:scale-95 transition-all outline-none border-0 cursor-pointer" 
              title="Minimieren"
            />
            <button 
              onClick={() => setIsFooterMinimized(false)}
              className="w-3 h-3 rounded-full bg-[#4a9e5c] hover:bg-green-400 active:scale-95 transition-all outline-none border-0 cursor-pointer" 
              title="Maximieren"
            />
          </div>

          {/* Console designation */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono font-extrabold text-[#d4943c] tracking-widest uppercase">
            <span className="animate-pulse">🔴</span>
            <span>DSP CONSOLE & CHROMATIC SEQUENCER</span>
            <span className="hidden md:inline text-[#7a6a58] font-normal lowercase tracking-normal">
              — {isFooterMinimized ? "klicken zum Maximieren ↗" : "klicken zum Minimieren ↘"}
            </span>
          </div>

          {/* Touch target Toggle Icon on the right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFooterMinimized(!isFooterMinimized);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all border-0 cursor-pointer bg-[#2a1e10] text-[#a89880] hover:text-[#d4943c] border border-[#4a3828]/60"
          >
            {isFooterMinimized ? (
              <>
                <ChevronUp size={12} className="stroke-[3]" /> MAXIMIEREN
              </>
            ) : (
              <>
                <ChevronDown size={12} className="stroke-[3]" /> MINIMIEREN
              </>
            )}
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-4 relative">

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
                    {timeline.length} Akkorde • {bpm} BPM • {
                      currentInst === "piano" ? "🎹 Piano" : 
                      currentInst === "guitar" ? "🎸 Classical" : 
                      currentInst === "guitar_acoustic" ? "🪕 Acoustic Steel" : 
                      currentInst === "guitar_electric_clean" ? "🎸 Electric Clean" : 
                      currentInst === "guitar_electric_dist" ? "⚡ Heavy Dist." : 
                      currentInst === "sax" ? "🎷 Saxophon" : 
                      currentInst === "djembe" ? "🪘 Djembe" : 
                      currentInst === "ukulele" ? "🪕 Ukulele" : 
                      currentInst === "strings" ? "🎻 Strings" : 
                      currentInst === "synth" ? "🎛️ Synth" : "🎸 Bass"
                    }
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
                    if (item.type === "recording") {
                      return (
                        <div
                          key={item.id}
                          className={`px-2 py-0.5 rounded-lg text-[8px] border shrink-0 font-bold flex items-center gap-1 ${
                            isActive
                              ? "border-[#d4943c] bg-[#d4943c]/15 text-[#d4943c]"
                              : "border-rose-700/30 bg-rose-950/10 text-rose-400"
                          }`}
                        >
                          <Mic size={8} /> {item.name || "Mic"} ({item.duration?.toFixed(1)}s)
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
                  onClick={() => setWhatsAppImportModalOpen(true)}
                  title="WhatsApp Song importieren"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer bg-[#4a9e5c]/25 border border-[#4a9e5c] text-[#6fc888] hover:bg-[#4a9e5c]/35 shrink-0"
                >
                  📥 Import
                </button>
                <button
                  onClick={copyProgression}
                  title="Akkorde & Import-Code kopieren"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#1a1008] border border-[#4a3828] text-[#c8b8a4] hover:text-[#d4943c] hover:border-[#d4943c]"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={shareWhatsApp}
                  title="Mit WhatsApp teilen"
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
                  { id: "guitar", label: "Classical", icon: <Guitar size={12} /> },
                  { id: "guitar_acoustic", label: "Acoustic Steel", icon: <Guitar size={12} className="text-[#f59e0b]" /> },
                  { id: "guitar_electric_clean", label: "Electric Clean", icon: <Guitar size={12} className="text-cyan-400" /> },
                  { id: "guitar_electric_dist", label: "Heavy Dist.", icon: <Guitar size={12} className="text-red-500" /> },
                  { id: "sax", label: "Saxophon", icon: <Music size={12} className="text-yellow-500" /> },
                  { id: "djembe", label: "Djembe", icon: <Drum size={12} /> },
                  { id: "ukulele", label: "Ukulele", icon: <Sliders size={12} /> },
                  { id: "strings", label: "Strings", icon: <Waves size={12} /> },
                  { id: "synth", label: "Synth", icon: <SlidersHorizontal size={12} /> },
                  { id: "bass", label: "Bass", icon: <Volume2 size={12} /> }
                ].map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setCurrentInst(inst.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      currentInst === inst.id
                        ? "bg-[#d4943c] text-[#1a1008] font-black animate-pulse"
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

              {/* Row 3: Advanced Drum & Bass & FX Rhythm Configs (Slick iOS Channel Strip Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4 pb-3 border-b border-[#4a3828]/40">
                {/* Channel Strip 1: Drums System */}
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-3 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 shrink-0 justify-between md:justify-start">
                    <div className="flex items-center gap-3">
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
                  </div>

                  {/* Volume Slider Section & Extra Desktop Sliders */}
                  <div className="flex flex-col gap-1.5 grow max-w-full md:max-w-[280px]">
                    {/* Primary volume slider */}
                    <div className="flex items-center gap-2 bg-[#120a04]/40 px-2.5 py-1.5 rounded-xl border border-[#4a3828]/30 w-full hover:border-[#d4943c]/35 transition-colors">
                      <Volume2 size={12} className={drumsOn ? "text-[#d4943c]" : "text-neutral-600"} />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={drumsVolume}
                        onChange={(e) => setDrumsVolume(Number(e.target.value))}
                        className="w-full h-1 bg-[#2a1e10] rounded-lg border-none accent-[#d4943c] cursor-ew-resize md:h-1.5"
                        disabled={!drumsOn}
                        title="Hauptlautstärke Drums"
                      />
                      <span className="text-[10px] font-mono font-extrabold text-[#d4943c] w-6 text-right">
                        {Math.round(drumsVolume * 100)}%
                      </span>
                    </div>

                    {/* Desktop Pitch tuning slider */}
                    <div className="flex items-center gap-2 bg-[#120a04]/40 px-2.5 py-1 rounded-xl border border-[#4a3828]/15 w-full hover:border-[#d4943c]/35 transition-colors">
                      <span className="text-[9px] font-mono font-bold text-[#7a6a58] shrink-0 uppercase">Pitch:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={drumsPitch}
                        onChange={(e) => setDrumsPitch(Number(e.target.value))}
                        className="w-full h-1 bg-[#2a1e10] rounded-lg border-none accent-[#d4943c] cursor-ew-resize opacity-65 hover:opacity-100 transition-opacity"
                        disabled={!drumsOn}
                        title="Drums-Stimmung / Pitch-Tuning"
                      />
                      <span className="text-[9px] font-mono font-extrabold text-[#d4943c] w-7 text-right">
                        {drumsPitch.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  {/* iOS Style Segmented Control */}
                  <div className="flex bg-[#120a04] p-0.5 rounded-xl border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none w-full md:w-auto relative gap-0.5 items-center">
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
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-3 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 shrink-0 justify-between md:justify-start">
                    <div className="flex items-center gap-3">
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
                  </div>

                  {/* Volume Slider Section & Extra Desktop Sliders */}
                  <div className="flex flex-col gap-1.5 grow max-w-full md:max-w-[280px]">
                    {/* Primary volume slider */}
                    <div className="flex items-center gap-2 bg-[#120a04]/40 px-2.5 py-1.5 rounded-xl border border-[#4a3828]/30 w-full hover:border-[#d4943c]/35 transition-colors">
                      <Volume2 size={12} className={basslineOn ? "text-[#d4943c]" : "text-neutral-600"} />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bassVolume}
                        onChange={(e) => setBassVolume(Number(e.target.value))}
                        className="w-full h-1 bg-[#2a1e10] rounded-lg border-none accent-[#d4943c] cursor-ew-resize md:h-1.5"
                        disabled={!basslineOn}
                        title="Hauptlautstärke Bass"
                      />
                      <span className="text-[10px] font-mono font-extrabold text-[#d4943c] w-6 text-right">
                        {Math.round(bassVolume * 100)}%
                      </span>
                    </div>

                    {/* Desktop Cutoff filter sweep slider */}
                    <div className="flex items-center gap-2 bg-[#120a04]/40 px-2.5 py-1 rounded-xl border border-[#4a3828]/15 w-full hover:border-[#d4943c]/35 transition-colors">
                      <span className="text-[9px] font-mono font-bold text-[#7a6a58] shrink-0 uppercase">Filter:</span>
                      <input
                        type="range"
                        min="100"
                        max="1200"
                        step="10"
                        value={bassFilterCutoff}
                        onChange={(e) => setBassFilterCutoff(Number(e.target.value))}
                        className="w-full h-1 bg-[#2a1e10] rounded-lg border-none accent-[#d4943c] cursor-ew-resize opacity-65 hover:opacity-100 transition-opacity"
                        disabled={!basslineOn}
                        title="Bass Tiefpass Filter-Cutoff Frequenz"
                      />
                      <span className="text-[9px] font-mono font-extrabold text-[#d4943c] w-9 text-right truncate">
                        {bassFilterCutoff}Hz
                      </span>
                    </div>
                  </div>

                  {/* iOS Style Segmented Control */}
                  <div className="flex bg-[#120a04] p-0.5 rounded-xl border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none w-full md:w-auto relative gap-0.5 items-center">
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

                {/* Channel Strip 3: DSP Pedalboard Rack (Stomp Switches for Mobile) */}
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-3 rounded-2xl flex flex-col justify-between gap-2.5 shadow-inner md:col-span-2 xl:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#c8b8a4] flex items-center gap-1.5">
                      <Sliders size={13} className="text-[#d4943c] animate-pulse" /> DSP-Quickboard
                    </span>
                    <span className="text-[9px] font-mono text-[#7a6a58] font-bold tracking-widest leading-none">
                      STATUS: {
                        pedalboard.overdrive.active || pedalboard.chorus.active || pedalboard.delay.active || pedalboard.reverb.active
                          ? "FX-ACTIVE"
                          : "FX-BYPASS"
                      }
                    </span>
                  </div>

                  {/* 4 neon status stomp buttons */}
                  <div className="grid grid-cols-4 gap-1.5 my-0.5">
                    {[
                      { 
                        id: "overdrive", 
                        label: "Drive", 
                        glowColor: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
                        active: pedalboard.overdrive.active,
                        toggle: () => setPedalboard(prev => ({ ...prev, overdrive: { ...prev.overdrive, active: !prev.overdrive.active } }))
                      },
                      { 
                        id: "chorus", 
                        label: "Chorus", 
                        glowColor: "bg-blue-400 shadow-[0_0_8px_#3b82f6]",
                        active: pedalboard.chorus.active,
                        toggle: () => setPedalboard(prev => ({ ...prev, chorus: { ...prev.chorus, active: !prev.chorus.active } }))
                      },
                      { 
                        id: "delay", 
                        label: "Delay", 
                        glowColor: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
                        active: pedalboard.delay.active,
                        toggle: () => setPedalboard(prev => ({ ...prev, delay: { ...prev.delay, active: !prev.delay.active } }))
                      },
                      { 
                        id: "reverb", 
                        label: "Reverb", 
                        glowColor: "bg-purple-400 shadow-[0_0_8px_#a855f7]",
                        active: pedalboard.reverb.active,
                        toggle: () => setPedalboard(prev => ({ ...prev, reverb: { ...prev.reverb, active: !prev.reverb.active } }))
                      }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          initAudio();
                          p.toggle();
                        }}
                        className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[9px] font-bold transition-all cursor-pointer border ${
                          p.active 
                            ? "bg-[#120a04] border-[#d4943c] text-white font-extrabold"
                            : "bg-[#120a04]/40 border-[#4a3828]/45 text-[#7a6a58] hover:text-[#c8b8a4]"
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full mb-1 transition-all ${p.active ? p.glowColor : "bg-neutral-800"}`} />
                        <span className="text-[8px] font-mono uppercase tracking-tighter">{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Rig selection inside channel strip */}
                  <div className="flex bg-[#120a04] p-0.5 rounded-xl border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none relative gap-0.5 items-center">
                    <span className="text-[8px] font-mono text-[#5f4e3c] px-1.5 font-bold uppercase shrink-0">Rig:</span>
                    {FX_PRESETS.reduce<any[]>((acc, cur) => {
                      // Avoid too many items in this tiny footer bar, let's keep it clean
                      if (cur.id !== "heavy_lead") {
                        acc.push(cur);
                      }
                      return acc;
                    }, []).map((p: any) => {
                      const isCurrent = (
                        pedalboard.overdrive.active === p.settings.overdrive.active &&
                        pedalboard.chorus.active === p.settings.chorus.active &&
                        pedalboard.delay.active === p.settings.delay.active &&
                        pedalboard.reverb.active === p.settings.reverb.active
                      );
                      return (
                        <button
                          key={p.id}
                          onClick={() => applyFxPreset(p.id)}
                          className={`relative px-1.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap z-10 shrink-0 ${
                            isCurrent ? "text-[#1a1008] font-extrabold" : "text-[#7a6a58] hover:text-[#c8b8a4]"
                          }`}
                        >
                          {isCurrent && (
                            <motion.div
                              layoutId="activeFxPillFooter"
                              className="absolute inset-0 bg-[#d4943c] rounded-lg -z-10 shadow-[0_1px_5px_rgba(212,148,60,0.35)]"
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                          )}
                          <span>{p.icon} {p.name.replace("Dry ", "").replace("Surf ", "")}</span>
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

                      if (item.type === "recording") {
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`flex-shrink-0 relative overflow-visible px-4 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              isActive
                                ? "border-[#d4943c] bg-[#d4943c]/15 text-[#d4943c] shadow-[0_0_12px_rgba(212,148,60,0.3)] scale-102"
                                : "border-rose-400/30 bg-rose-950/10 text-rose-300"
                            }`}
                          >
                            <span className="text-[7px] font-mono text-[#a89880] absolute top-1 left-2">
                              {idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1.5 select-none">
                              <Mic size={10} className="text-rose-400 animate-pulse" />
                              <span className="text-xs font-bold truncate max-w-[80px]">
                                {item.name || "Microphone"}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-[#a89880] mt-0.5">
                              {item.duration ? `${item.duration.toFixed(1)}s` : "0.0s"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTimelineItem(item.id);
                              }}
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
              <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2 border-t border-[#4a3828]/25">
                <div className="flex flex-wrap items-center gap-1.5">
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
                </div>

                {/* Song configuration name */}
                <div className="flex items-center gap-2 bg-[#120a04]/80 px-2.5 py-1.5 rounded-xl border border-[#4a3828]/50 shadow-inner max-w-full">
                  <span className="text-[10px] font-mono text-[#7a6a58] shrink-0 font-extrabold uppercase">Titel:</span>
                  <input
                    type="text"
                    value={whatsAppSongTitle}
                    onChange={(e) => setWhatsAppSongTitle(e.target.value)}
                    placeholder="Mein Jam-Song"
                    className="bg-transparent border-0 text-xs text-[#d4943c] font-black p-0 focus:outline-none focus:ring-0 w-24 sm:w-28 placeholder-[#7a6a58]/50"
                    title="Benenne deinen Song vor dem WhatsApp-Teilen"
                  />
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setWhatsAppImportModalOpen(true)}
                    title="Importiere einen per WhatsApp erhaltenen Song deines Kumpels"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#4a9e5c]/25 border border-[#4a9e5c] text-[#6fc888] hover:bg-[#4a9e5c]/40 font-mono text-[10px]"
                  >
                    📥 WhatsApp-Import
                  </button>
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
                    <Share2 size={12} /> WhatsApp Senden
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* WhatsApp Import Modal */}
      <AnimatePresence>
        {whatsAppImportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setWhatsAppImportModalOpen(false);
              setWhatsAppImportText("");
            }}
            className="fixed inset-0 bg-black/85 z-55 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#2a1e10] border-2 border-[#4a3828] p-6 rounded-2xl max-w-lg w-full text-sm leading-relaxed shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#4a3828]/40">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📩</span>
                  <h2 className="text-lg font-serif text-[#d4943c] font-black">
                    Akkorde aus WhatsApp laden
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setWhatsAppImportModalOpen(false);
                    setWhatsAppImportText("");
                  }}
                  className="p-1 text-[#7a6a58] hover:text-[#f0e0cc] transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-[#a89880] leading-normal font-medium">
                  Kopiere die <strong>gesamte Nachricht</strong>, die du von deinem Freund auf WhatsApp erhalten hast, und füge sie unten in das Textfeld ein. Die App extrahiert automatisch alle Akkorde, Tempo, Rhythmus und Instrument-Setups!
                </p>

                <textarea
                  value={whatsAppImportText}
                  onChange={(e) => setWhatsAppImportText(e.target.value)}
                  placeholder="Füge die WhatsApp-Nachricht deines Freundes hier ein (inklusive des Codes ganz unten)..."
                  className="w-full h-40 bg-[#120a04] border border-[#4a3828] text-[#f0e0cc] text-xs font-mono p-3 rounded-xl focus:outline-none focus:border-[#d4943c] placeholder-[#7a6a58]/55"
                />

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => {
                      setWhatsAppImportText("");
                      setWhatsAppImportModalOpen(false);
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-lg border border-[#4a3828] text-[#7a6a58] hover:text-[#f0e0cc] transition-all bg-transparent cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => importFromWhatsApp(whatsAppImportText)}
                    className="px-5 py-2 text-xs font-black uppercase rounded-lg bg-[#4a9e5c] hover:bg-green-600 text-white shadow-[0_4px_12px_rgba(74,158,92,0.35)] transition-all flex items-center gap-1.5 border-none cursor-pointer"
                  >
                    🚀 Laden & Einspielen
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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



      {/* iOS Style Long Press Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu && contextMenu.isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
            onClick={() => setContextMenu(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className="bg-[#1f130a] border border-[#d4943c]/65 p-6 rounded-3xl max-w-[320px] w-full shadow-[0_24px_60px_rgba(0,0,0,0.9)] text-center relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Context Menu Header */}
              <div className="flex justify-between items-center mb-4 border-b border-[#4a3828]/40 pb-3">
                <span className="text-[10px] font-mono text-[#7a6a58] uppercase font-black tracking-widest">
                  iOS Akkord-Optionen
                </span>
                <button
                  onClick={() => setContextMenu(null)}
                  className="text-[#7a6a58] hover:text-[#d4943c] cursor-pointer text-xs font-mono font-bold hover:scale-110 transition-transform"
                >
                  Schließen
                </button>
              </div>

              {/* Title representation */}
              <div className="py-2.5 mb-5 bg-[#120a04] border border-[#4a3828]/40 rounded-2xl">
                <span className="block text-4xl font-serif font-black text-[#d4943c] tracking-tight drop-shadow font-serif">
                  {capoName(contextMenu.chordData.semitone, contextMenu.chordData.suffix)}
                </span>
                <span className="block text-[10px] font-mono text-[#7a6a58] mt-1 uppercase tracking-wider font-bold">
                  Stufe {contextMenu.chordData.roman || "N/A"} • Root: {contextMenu.chordData.semitone}
                </span>
              </div>

              {/* Action Rows */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    addChordToTimeline(contextMenu.chordData.name, contextMenu.chordData.semitone, contextMenu.chordData.quality);
                    setContextMenu(null);
                    showToast(`${contextMenu.chordData.name} am Ende hinzugefügt`);
                  }}
                  className="w-full flex items-center justify-between bg-[#2a1e10] hover:bg-[#d4943c] hover:text-[#1a1008] text-[#f0e0cc] border border-[#4a3828] font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer text-left active:scale-[0.97]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">➕</span> Am Ende anhängen
                  </span>
                  <span className="text-[9px] font-mono opacity-50 uppercase font-black">Append</span>
                </button>

                <button
                  onClick={() => {
                    const match = getDiatonicChords(selKey).find(
                      (c) => c.semitone === contextMenu.chordData.semitone && c.quality === contextMenu.chordData.quality
                    );
                    const suffix = match ? match.suffix : contextMenu.chordData.quality === "min" ? "m" : contextMenu.chordData.quality === "dim" ? "dim" : "";
                    const roman = match ? match.roman : "";
                    const newItem: TimelineItem = {
                      type: "chord",
                      name: contextMenu.chordData.name,
                      semitone: contextMenu.chordData.semitone,
                      quality: contextMenu.chordData.quality,
                      suffix,
                      roman,
                      id: uidRef.current++
                    };
                    setTimeline((prev) => [newItem, ...prev]);
                    playChordInst(contextMenu.chordData.semitone, contextMenu.chordData.quality, 0.7, strumPattern);
                    setContextMenu(null);
                    showToast(`${contextMenu.chordData.name} an den Anfang gesetzt`);
                  }}
                  className="w-full flex items-center justify-between bg-[#2a1e10] hover:bg-[#d4943c] hover:text-[#1a1008] text-[#f0e0cc] border border-[#4a3828] font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer text-left active:scale-[0.97]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">🔼</span> Am Anfang einfügen
                  </span>
                  <span className="text-[9px] font-mono opacity-50 uppercase font-black">Prepend</span>
                </button>

                <button
                  onClick={() => {
                    playChordInst(contextMenu.chordData.semitone, contextMenu.chordData.quality, 0.8, strumPattern);
                  }}
                  className="w-full flex items-center justify-between bg-[#2a1e10] hover:bg-[#d4943c] hover:text-[#1a1008] text-[#f0e0cc] border border-[#4a3828] font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer text-left active:scale-[0.97]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">🔊</span> Akkord anspielen
                  </span>
                  <span className="text-[9px] font-mono opacity-50 uppercase font-black">Audition</span>
                </button>

                <div className="h-px bg-[#4a3828]/40 my-3" />

                {/* Sub-variant selector */}
                <span className="block text-[10px] font-mono text-[#7a6a58] uppercase text-left tracking-widest mb-1.5 font-bold">
                  Variante anpassen:
                </span>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(["maj", "min", "dim"] as const).map((q) => {
                    const qLabel = q === "maj" ? "Dur" : q === "min" ? "Moll" : "Verm.";
                    const rootNote = noteNameAny(contextMenu.chordData.semitone, selKey);
                    const newName = rootNote + (q === "min" ? "m" : q === "dim" ? "dim" : "");
                    const isSelected = contextMenu.chordData.quality === q;

                    return (
                      <button
                        key={q}
                        onClick={() => {
                          setContextMenu({
                            ...contextMenu,
                            chordData: {
                              ...contextMenu.chordData,
                              quality: q,
                              name: newName,
                              suffix: q === "min" ? "m" : q === "dim" ? "dim" : ""
                            }
                          });
                          playChordInst(contextMenu.chordData.semitone, q, 0.7, strumPattern);
                        }}
                        className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#d4943c] border-[#d4943c] text-[#1a1008] font-black"
                            : "bg-[#120a04] border-[#4a3828]/50 text-[#7a6a58] hover:text-[#c8b8a4]"
                        }`}
                      >
                        {qLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="h-px bg-[#4a3828]/40 my-3" />

                <button
                  onClick={() => {
                    setTheoryKey(contextMenu.chordData.semitone);
                    setTab("theorie");
                    setContextMenu(null);
                    showToast(`In Theorie analysiert: ${contextMenu.chordData.name}`);
                  }}
                  className="w-full flex items-center justify-between bg-[#4a9e5c]/10 hover:bg-[#4a9e5c] text-[#6fc888] hover:text-[#1a1008] border border-[#4a9e5c]/35 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer text-left active:scale-[0.97]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">🌀</span> Musiktheorie Analyse
                  </span>
                  <span className="text-[9px] font-mono opacity-80 uppercase font-black">Theory</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
