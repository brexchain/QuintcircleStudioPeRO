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
  X,
  Sun,
  Moon,
  Disc,
  Download
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
  // Custom Songwriter Additions
  bpmOverride?: number;
  dynamic?: "normal" | "piano" | "forte" | "crescendo" | "decrescendo" | "break";
  technique?: "normal" | "hold" | "break";
  strumOverride?: "block" | "arpeggio" | "strum";
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
    fxPresetId: "cozy_lounge",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.4, depth: 0.3, mix: 0.28 },
      delay: { active: false, time: 0.35, feedback: 0.3, mix: 0.25 },
      reverb: { active: true, decay: 1.4, mix: 0.26 }
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
    fxPresetId: "crunchy",
    pedalboard: {
      overdrive: { active: true, drive: 0.52, tone: 0.6, volume: 0.8 },
      chorus: { active: false, rate: 1.5, depth: 0.35, mix: 0.4 },
      delay: { active: false, time: 0.38, feedback: 0.45, mix: 0.4 },
      reverb: { active: true, decay: 1.8, mix: 0.22 }
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
    fxPresetId: "dream_space",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.2, depth: 0.6, mix: 0.55 },
      delay: { active: true, time: 0.52, feedback: 0.55, mix: 0.5 },
      reverb: { active: true, decay: 3.5, mix: 0.48 }
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
    fxPresetId: "cozy_lounge",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.4, depth: 0.3, mix: 0.28 },
      delay: { active: false, time: 0.35, feedback: 0.3, mix: 0.25 },
      reverb: { active: true, decay: 1.4, mix: 0.26 }
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
    fxPresetId: "surf_spring",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 2.4, depth: 0.18, mix: 0.25 },
      delay: { active: true, time: 0.22, feedback: 0.32, mix: 0.4 },
      reverb: { active: true, decay: 2.8, mix: 0.52 }
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
    fxPresetId: "surf_spring",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 2.4, depth: 0.18, mix: 0.25 },
      delay: { active: true, time: 0.22, feedback: 0.32, mix: 0.4 },
      reverb: { active: true, decay: 2.8, mix: 0.52 }
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
    fxPresetId: "cosmic_clouds",
    pedalboard: {
      overdrive: { active: false, drive: 0.4, tone: 0.5, volume: 0.7 },
      chorus: { active: true, rate: 0.8, depth: 0.5, mix: 0.45 },
      delay: { active: true, time: 0.72, feedback: 0.75, mix: 0.58 },
      reverb: { active: true, decay: 5.2, mix: 0.62 }
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
    fxPresetId: "cosmic_clouds",
    pedalboard: {
      overdrive: { active: false, drive: 0.4, tone: 0.5, volume: 0.7 },
      chorus: { active: true, rate: 0.8, depth: 0.5, mix: 0.45 },
      delay: { active: true, time: 0.72, feedback: 0.75, mix: 0.58 },
      reverb: { active: true, decay: 5.2, mix: 0.62 }
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
    fxPresetId: "crunchy",
    pedalboard: {
      overdrive: { active: true, drive: 0.52, tone: 0.6, volume: 0.8 },
      chorus: { active: false, rate: 1.5, depth: 0.35, mix: 0.4 },
      delay: { active: false, time: 0.38, feedback: 0.45, mix: 0.4 },
      reverb: { active: true, decay: 1.8, mix: 0.22 }
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
    fxPresetId: "psychedelic",
    pedalboard: {
      overdrive: { active: true, drive: 0.35, tone: 0.5, volume: 0.75 },
      chorus: { active: true, rate: 4.2, depth: 0.75, mix: 0.65 },
      delay: { active: false, time: 0.3, feedback: 0.4, mix: 0.3 },
      reverb: { active: true, decay: 2.2, mix: 0.35 }
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
    fxPresetId: "cozy_lounge",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.4, depth: 0.3, mix: 0.28 },
      delay: { active: false, time: 0.35, feedback: 0.3, mix: 0.25 },
      reverb: { active: true, decay: 1.4, mix: 0.26 }
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
    fxPresetId: "heavy_lead",
    pedalboard: {
      overdrive: { active: true, drive: 0.88, tone: 0.7, volume: 0.9 },
      chorus: { active: true, rate: 1.6, depth: 0.25, mix: 0.32 },
      delay: { active: true, time: 0.32, feedback: 0.42, mix: 0.38 },
      reverb: { active: true, decay: 2.6, mix: 0.44 }
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
    fxPresetId: "surf_spring",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 2.4, depth: 0.18, mix: 0.25 },
      delay: { active: true, time: 0.22, feedback: 0.32, mix: 0.4 },
      reverb: { active: true, decay: 2.8, mix: 0.52 }
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
    fxPresetId: "cozy_lounge",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.4, depth: 0.3, mix: 0.28 },
      delay: { active: false, time: 0.35, feedback: 0.3, mix: 0.25 },
      reverb: { active: true, decay: 1.4, mix: 0.26 }
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
    fxPresetId: "dream_space",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.2, depth: 0.6, mix: 0.55 },
      delay: { active: true, time: 0.52, feedback: 0.55, mix: 0.5 },
      reverb: { active: true, decay: 3.5, mix: 0.48 }
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
    fxPresetId: "heavy_lead",
    pedalboard: {
      overdrive: { active: true, drive: 0.88, tone: 0.7, volume: 0.9 },
      chorus: { active: true, rate: 1.6, depth: 0.25, mix: 0.32 },
      delay: { active: true, time: 0.32, feedback: 0.42, mix: 0.38 },
      reverb: { active: true, decay: 2.6, mix: 0.44 }
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
    fxPresetId: "heavy_lead",
    pedalboard: {
      overdrive: { active: true, drive: 0.88, tone: 0.7, volume: 0.9 },
      chorus: { active: true, rate: 1.6, depth: 0.25, mix: 0.32 },
      delay: { active: true, time: 0.32, feedback: 0.42, mix: 0.38 },
      reverb: { active: true, decay: 2.6, mix: 0.44 }
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
    fxPresetId: "cozy_lounge",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.4, depth: 0.3, mix: 0.28 },
      delay: { active: false, time: 0.35, feedback: 0.3, mix: 0.25 },
      reverb: { active: true, decay: 1.4, mix: 0.26 }
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
    fxPresetId: "dream_space",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.2, depth: 0.6, mix: 0.55 },
      delay: { active: true, time: 0.52, feedback: 0.55, mix: 0.5 },
      reverb: { active: true, decay: 3.5, mix: 0.48 }
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
    fxPresetId: "surf_spring",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 2.4, depth: 0.18, mix: 0.25 },
      delay: { active: true, time: 0.22, feedback: 0.32, mix: 0.4 },
      reverb: { active: true, decay: 2.8, mix: 0.52 }
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
    fxPresetId: "crunchy",
    pedalboard: {
      overdrive: { active: true, drive: 0.52, tone: 0.6, volume: 0.8 },
      chorus: { active: false, rate: 1.5, depth: 0.35, mix: 0.4 },
      delay: { active: false, time: 0.38, feedback: 0.45, mix: 0.4 },
      reverb: { active: true, decay: 1.8, mix: 0.22 }
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
    fxPresetId: "psychedelic",
    pedalboard: {
      overdrive: { active: true, drive: 0.35, tone: 0.5, volume: 0.75 },
      chorus: { active: true, rate: 4.2, depth: 0.75, mix: 0.65 },
      delay: { active: false, time: 0.3, feedback: 0.4, mix: 0.3 },
      reverb: { active: true, decay: 2.2, mix: 0.35 }
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
    fxPresetId: "dream_space",
    pedalboard: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.2, depth: 0.6, mix: 0.55 },
      delay: { active: true, time: 0.52, feedback: 0.55, mix: 0.5 },
      reverb: { active: true, decay: 3.5, mix: 0.48 }
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
    fxPresetId: "heavy_lead",
    pedalboard: {
      overdrive: { active: true, drive: 0.88, tone: 0.7, volume: 0.9 },
      chorus: { active: true, rate: 1.6, depth: 0.25, mix: 0.32 },
      delay: { active: true, time: 0.32, feedback: 0.42, mix: 0.38 },
      reverb: { active: true, decay: 2.6, mix: 0.44 }
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
  { id: "strum", label: "Zupfen", icon: "🪕" },
  { id: "balkan_7_8", label: "7/8 Balkan (3-2-2)", icon: "🔥" },
  { id: "balkan_9_8", label: "9/8 Balkan (2-2-2-3)", icon: "🌟" },
  { id: "reggae", label: "Reggae", icon: "🌴" },
  { id: "rumba", label: "Rumba/Pop", icon: "💃" },
  { id: "waltz", label: "3/4 Walzer", icon: "🩰" }
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
    name: "Warm Tube Crunch",
    icon: "🔥",
    desc: "Warme Röhrenkompression & milder Overdrive",
    settings: {
      overdrive: { active: true, drive: 0.52, tone: 0.6, volume: 0.8 },
      chorus: { active: false, rate: 1.5, depth: 0.35, mix: 0.4 },
      delay: { active: false, time: 0.38, feedback: 0.45, mix: 0.4 },
      reverb: { active: true, decay: 1.8, mix: 0.22 }
    }
  },
  {
    id: "heavy_lead",
    name: "High-Gain Arena",
    icon: "🎸",
    desc: "Satter Lead-Overdrive für röhrende Soli",
    settings: {
      overdrive: { active: true, drive: 0.88, tone: 0.7, volume: 0.9 },
      chorus: { active: true, rate: 1.6, depth: 0.25, mix: 0.32 },
      delay: { active: true, time: 0.32, feedback: 0.42, mix: 0.38 },
      reverb: { active: true, decay: 2.6, mix: 0.44 }
    }
  },
  {
    id: "dream_space",
    name: "Dreamy Echo Wave",
    icon: "🌌",
    desc: "Sphärischer Modulations-Hall mit weitem Delay",
    settings: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.2, depth: 0.6, mix: 0.55 },
      delay: { active: true, time: 0.52, feedback: 0.55, mix: 0.5 },
      reverb: { active: true, decay: 3.5, mix: 0.48 }
    }
  },
  {
    id: "surf_spring",
    name: "Surf Spring Splash",
    icon: "🌊",
    desc: "Nasser Retro-Federhall mit Slapback-Echo",
    settings: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 2.4, depth: 0.18, mix: 0.25 },
      delay: { active: true, time: 0.22, feedback: 0.32, mix: 0.4 },
      reverb: { active: true, decay: 2.8, mix: 0.52 }
    }
  },
  {
    id: "psychedelic",
    name: "Psychedelic Rotary",
    icon: "🌀",
    desc: "Schwebender Leslie-Modulations-Effekt",
    settings: {
      overdrive: { active: true, drive: 0.35, tone: 0.5, volume: 0.75 },
      chorus: { active: true, rate: 4.2, depth: 0.75, mix: 0.65 },
      delay: { active: false, time: 0.3, feedback: 0.4, mix: 0.3 },
      reverb: { active: true, decay: 2.2, mix: 0.35 }
    }
  },
  {
    id: "cosmic_clouds",
    name: "Cosmic Starry Sky",
    icon: "☄️",
    desc: "Unendliche Weiten durch maximale Raumtiefe",
    settings: {
      overdrive: { active: false, drive: 0.4, tone: 0.5, volume: 0.7 },
      chorus: { active: true, rate: 0.8, depth: 0.5, mix: 0.45 },
      delay: { active: true, time: 0.72, feedback: 0.75, mix: 0.58 },
      reverb: { active: true, decay: 5.2, mix: 0.62 }
    }
  },
  {
    id: "cozy_lounge",
    name: "Cozy Ambient Room",
    icon: "🏡",
    desc: "Intimes Club-Ambiente mit feiner Chorusharmonie",
    settings: {
      overdrive: { active: false, drive: 0.45, tone: 0.55, volume: 0.7 },
      chorus: { active: true, rate: 1.4, depth: 0.3, mix: 0.28 },
      delay: { active: false, time: 0.35, feedback: 0.3, mix: 0.25 },
      reverb: { active: true, decay: 1.4, mix: 0.26 }
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
  const [activeInstruments, setActiveInstruments] = useState<string[]>(["piano"]);
  const [drumsOn, setDrumsOn] = useState<boolean>(false);
  const [basslineOn, setBasslineOn] = useState<boolean>(false);
  const [beatsPerBar, setBeatsPerBar] = useState<3 | 4>(4);
  const [strumPattern, setStrumPattern] = useState<string>("block");
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
  const [whatsAppWarningModalOpen, setWhatsAppWarningModalOpen] = useState<boolean>(false);
  const [whatsAppWarningReason, setWhatsAppWarningReason] = useState<"length" | "recordings" | "both">("length");
  const [whatsAppSongTitle, setWhatsAppSongTitle] = useState<string>("Mein Jam-Preset");
  const [toastMsg, setToastMsg] = useState<string>("");
  const [isFooterMinimized, setIsFooterMinimized] = useState<boolean>(false);
  const [drumsExpanded, setDrumsExpanded] = useState<boolean>(false);
  const [bassExpanded, setBassExpanded] = useState<boolean>(false);
  const [dspExpanded, setDspExpanded] = useState<boolean>(false);
  const [expandedSection, setExpandedSection] = useState<"navigation" | "sequencer" | "instruments" | "style" | "trash" | null>("navigation");
  
  // Custom Songwriter & LocalStorage States
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);
  const [newSongName, setNewSongName] = useState<string>("");
  const [savedSongs, setSavedSongs] = useState<any[]>(() => {
    try {
      const local = localStorage.getItem("jam_saved_songs");
      return local ? JSON.parse(local) : [];
    } catch (e) {
      console.warn("Could not load songs from localStorage", e);
      return [];
    }
  });

  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("jam_light_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("jam_light_mode", isLightMode ? "true" : "false");
    } catch (e) {
      console.warn("Could not save light mode to localStorage", e);
    }
  }, [isLightMode]);

  // Sync saved list to local storage
  useEffect(() => {
    try {
      localStorage.setItem("jam_saved_songs", JSON.stringify(savedSongs));
    } catch (e) {
      console.warn("Could not save songs to localStorage", e);
    }
  }, [savedSongs]);

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

  const activeInstrumentsRef = useRef<string[]>(["piano"]);
  const currentInstRef = useRef<string>("piano");
  const strumPatternRef = useRef<string>("block");
  const bpmRef = useRef<number>(100);
  const drumsOnRef = useRef<boolean>(false);
  const basslineOnRef = useRef<boolean>(false);
  const beatsPerBarRef = useRef<number>(4);

  useEffect(() => { activeInstrumentsRef.current = activeInstruments; }, [activeInstruments]);
  useEffect(() => { currentInstRef.current = currentInst; }, [currentInst]);
  useEffect(() => { strumPatternRef.current = strumPattern; }, [strumPattern]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { drumsOnRef.current = drumsOn; }, [drumsOn]);
  useEffect(() => { basslineOnRef.current = basslineOn; }, [basslineOn]);
  useEffect(() => { beatsPerBarRef.current = beatsPerBar; }, [beatsPerBar]);

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
    if (!selected) return;

    // Check if the selected preset settings match the current pedalboard active states perfectly
    const isCurrent = (
      pedalboard.overdrive.active === selected.settings.overdrive.active &&
      pedalboard.chorus.active === selected.settings.chorus.active &&
      pedalboard.delay.active === selected.settings.delay.active &&
      pedalboard.reverb.active === selected.settings.reverb.active
    );

    initAudio();
    if (isCurrent && presetId !== "bypass") {
      // Toggle off to dry bypass
      const bypass = FX_PRESETS.find(p => p.id === "bypass");
      if (bypass) {
        setPedalboard({
          overdrive: { ...bypass.settings.overdrive },
          chorus: { ...bypass.settings.chorus },
          delay: { ...bypass.settings.delay },
          reverb: { ...bypass.settings.reverb }
        });
        showToast("⚡ Bypass: FX-Rigs komplett getrennt");
      }
    } else {
      setPedalboard({
        overdrive: { ...selected.settings.overdrive },
        chorus: { ...selected.settings.chorus },
        delay: { ...selected.settings.delay },
        reverb: { ...selected.settings.reverb }
      });
      showToast(presetId === "bypass" ? "⚡ Bypass: FX-Rigs komplett getrennt" : `⚡ Rig geladen: ${selected.name}`);
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
    delNode.delayTime.setValueAtTime(0.38, ctx.currentTime);
    const delFeedback = ctx.createGain();
    delFeedback.gain.setValueAtTime(0.3, ctx.currentTime);

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

    // Dynamic Limiter/Compressor to stop clipping distortion when all play at the same time
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-2, ctx.currentTime); // begin compressing just under 0dB
    limiter.knee.setValueAtTime(8, ctx.currentTime);
    limiter.ratio.setValueAtTime(20, ctx.currentTime); // high ratio acts as rigid limiter
    limiter.attack.setValueAtTime(0.003, ctx.currentTime); // fast attack to catch quick peaks
    limiter.release.setValueAtTime(0.08, ctx.currentTime);

    finalOut.connect(limiter);
    limiter.connect(ctx.destination);

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
      // Always safely update internal delay parameters to avoid 0ms delay at 1.0 feedback level feedback loops
      delNode.delayTime.setValueAtTime(0.05 + pedalboard.delay.time * 0.95, ctx.currentTime);
      delFb.gain.setValueAtTime(pedalboard.delay.feedback * 0.75, ctx.currentTime);

      if (pedalboard.delay.active) {
        delDry.gain.setValueAtTime(1.0, ctx.currentTime);
        delWet.gain.setValueAtTime(pedalboard.delay.mix * 0.85, ctx.currentTime);
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
    const baseMasterGain = masterGainRef.current;
    if (!ctx || !baseMasterGain) return;

    // Read real-time synchronized instruments & tempo configs
    const targetInstId = currentInstRef.current || currentInst;
    const instrumentsToPlay = activeInstrumentsRef.current && activeInstrumentsRef.current.length > 0 
      ? activeInstrumentsRef.current 
      : [targetInstId];
    
    const N = instrumentsToPlay.length;
    // Downscale gain factor proportionally to the number of active instruments to prevent clipping
    const scaleFactor = 1.0 / Math.pow(N, 0.55);

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(scaleFactor, ctx.currentTime);
    chordGain.connect(baseMasterGain);

    const masterGain = chordGain;
    const activeBpm = bpmRef.current || bpm;
    const activeBeatsPerBar = beatsPerBarRef.current || beatsPerBar;
    const beatDur = 60 / activeBpm;

    // Unified helper to play a single voice element for a specific instrument
    const playChordNote = (semi: number, t: number, noteLength: number, vel: number, instId: string) => {
      const f = 130.81 * Math.pow(2, semi / 12);
      
      switch (instId) {
        case "piano": {
          // Acoustic Piano emulation using 4 harmonics with individual decays + hammer strike
          const baseVol = 0.055 * vel;
          
          // Hammer click/strike noise
          const hammer = ctx.createOscillator();
          const hammerG = ctx.createGain();
          hammer.type = "triangle";
          hammer.frequency.value = f * 7.5;
          hammerG.gain.setValueAtTime(baseVol * 0.6, t);
          hammerG.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
          hammer.connect(hammerG);
          hammerG.connect(masterGain);
          hammer.start(t);
          hammer.stop(t + 0.02);

          // 4 sympathetic string harmonics
          const harmonics = [1, 2, 3, 4];
          harmonics.forEach((h) => {
            const hf = f * h;
            if (hf > 18000) return;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = hf;
            
            const envelopeGain = (baseVol * (1.2 / h));
            const decay = Math.max(0.2, noteLength * (1.8 / h));
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(envelopeGain, t + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
            
            osc.connect(g);
            g.connect(masterGain);
            osc.start(t);
            osc.stop(t + decay + 0.05);
          });
          break;
        }
        case "guitar": {
          // Classic Classical Acoustic Guitar Nylon Pluck
          // Lowpass filter frequency sweeps exponentially down on string release!
          const baseVol = 0.07 * vel;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.value = f;
          osc2.type = "sine";
          osc2.frequency.value = f * 2.0;

          filter.type = "lowpass";
          filter.Q.value = 1.5;
          filter.frequency.setValueAtTime(2000, t);
          filter.frequency.exponentialRampToValueAtTime(280, t + 0.18);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          osc1.start(t);
          osc1.stop(t + noteLength + 0.05);
          osc2.start(t);
          osc2.stop(t + noteLength + 0.05);
          break;
        }
        case "guitar_acoustic": {
          // Steel acoustic guitar: sharp metallic twang + pick snap sound
          const baseVol = 0.06 * vel;
          const oscSaw = ctx.createOscillator();
          const oscTri = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          oscSaw.type = "sawtooth";
          oscSaw.frequency.value = f;
          oscTri.type = "triangle";
          oscTri.frequency.value = f * 2.01; // slightly detuned octave course

          filter.type = "lowpass";
          filter.Q.value = 3.0; // ringing peak
          filter.frequency.setValueAtTime(4500, t);
          filter.frequency.exponentialRampToValueAtTime(450, t + 0.12);

          // Fast noise pick hit
          const noise = ctx.createBufferSource();
          noise.buffer = getNoiseBuffer();
          const noiseF = ctx.createBiquadFilter();
          noiseF.type = "highpass";
          noiseF.frequency.value = 3500;
          const noiseG = ctx.createGain();
          noiseG.gain.setValueAtTime(baseVol * 0.75, t);
          noiseG.gain.exponentialRampToValueAtTime(0.0001, t + 0.008);
          noise.connect(noiseF);
          noiseF.connect(noiseG);
          noiseG.connect(masterGain);
          noise.start(t);
          noise.stop(t + 0.015);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.003);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength * 0.9);

          oscSaw.connect(filter);
          oscTri.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          oscSaw.start(t);
          oscSaw.stop(t + noteLength + 0.05);
          oscTri.start(t);
          oscTri.stop(t + noteLength + 0.05);
          break;
        }
        case "guitar_electric_clean": {
          // Warm clean electric jazz wood-body guitar + soft warm tremolo
          const baseVol = 0.075 * vel;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.value = f;
          osc2.type = "triangle";
          osc2.frequency.value = f * 1.995; // chorus detuning

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1100, t);
          
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.012); // slightly warmer slope
          g.gain.exponentialRampToValueAtTime(baseVol * 0.4, t + 0.3);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          osc1.start(t);
          osc1.stop(t + noteLength + 0.05);
          osc2.start(t);
          osc2.stop(t + noteLength + 0.05);
          break;
        }
        case "guitar_electric_dist": {
          // Epic high-gain heavy grunge/metal distortion
          const baseVol = 0.035 * vel;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const shaper = ctx.createWaveShaper();
          const cab = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.value = f;
          osc1.detune.value = -6;
          osc2.type = "sawtooth";
          osc2.frequency.value = f;
          osc2.detune.value = 6;

          shaper.curve = makeDistortionCurve(110); // extreme tube distortion clip
          shaper.oversample = "4x";

          cab.type = "peaking"; // cabinet mid rise simulation
          cab.frequency.value = 1800;
          cab.Q.value = 1.3;
          cab.gain.value = 10; // high boost on cab frequencies

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.004);
          g.gain.linearRampToValueAtTime(baseVol * 0.85, t + 0.1);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength);

          osc1.connect(shaper);
          osc2.connect(shaper);
          shaper.connect(cab);
          cab.connect(g);
          g.connect(masterGain);

          osc1.start(t);
          osc1.stop(t + noteLength + 0.05);
          osc2.start(t);
          osc2.stop(t + noteLength + 0.05);
          break;
        }
        case "sax": {
          // Warm jazz woodwind reed sax with custom formant filter
          const baseVol = 0.045 * vel;
          const oscSaw = ctx.createOscillator();
          const oscTri = ctx.createOscillator();
          const formantFilter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          oscSaw.type = "sawtooth";
          oscSaw.frequency.value = f * 0.999;
          oscTri.type = "triangle";
          oscTri.frequency.value = f * 2.001;

          // Air wind/breath sound
          const air = ctx.createBufferSource();
          air.buffer = getNoiseBuffer();
          const airF = ctx.createBiquadFilter();
          airF.type = "bandpass";
          airF.frequency.value = 1200;
          airF.Q.value = 1.0;
          const airG = ctx.createGain();
          airG.gain.setValueAtTime(0, t);
          airG.gain.linearRampToValueAtTime(baseVol * 0.18, t + 0.035);
          airG.gain.exponentialRampToValueAtTime(0.0001, t + noteLength);
          air.connect(airF);
          airF.connect(airG);
          airG.connect(masterGain);
          air.start(t);
          air.stop(t + noteLength);

          formantFilter.type = "peaking"; // Sax voice pipe frequency
          formantFilter.frequency.setValueAtTime(750, t);
          formantFilter.Q.value = 2.2;
          formantFilter.gain.value = 12;

          // 5.2Hz Sax player vibrato
          const vibrato = ctx.createOscillator();
          const vibratoG = ctx.createGain();
          vibrato.frequency.value = 5.2;
          vibratoG.gain.value = f * 0.015;
          vibrato.connect(vibratoG);
          vibratoG.connect(oscSaw.frequency);
          vibratoG.connect(oscTri.frequency);
          vibrato.start(t);
          vibrato.stop(t + noteLength);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.045); // wind swell
          g.gain.setValueAtTime(baseVol, t + noteLength - 0.12);
          g.gain.linearRampToValueAtTime(0.0001, t + noteLength);

          oscSaw.connect(formantFilter);
          oscTri.connect(formantFilter);
          formantFilter.connect(g);
          g.connect(masterGain);

          oscSaw.start(t);
          oscSaw.stop(t + noteLength + 0.05);
          oscTri.start(t);
          oscTri.stop(t + noteLength + 0.05);
          break;
        }
        case "trumpet": {
          // Sharp, bright, recognizable brass ensemble trumpet with sweep
          const baseVol = 0.04 * vel;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.value = f;
          osc2.type = "sawtooth";
          osc2.frequency.value = f * 2.0;

          // Brassy sweep filter simulates lips pressure building
          filter.type = "lowpass";
          filter.Q.value = 2.5;
          filter.frequency.setValueAtTime(320, t);
          filter.frequency.exponentialRampToValueAtTime(2600, t + 0.052);
          filter.frequency.linearRampToValueAtTime(1400, t + noteLength);

          // Lip vibrato
          const vibrato = ctx.createOscillator();
          const vibratoG = ctx.createGain();
          vibrato.frequency.value = 6.4; // rapid trumpet vibrato
          vibratoG.gain.value = f * 0.012;
          vibrato.connect(vibratoG);
          vibratoG.connect(osc1.frequency);
          vibratoG.connect(osc2.frequency);
          vibrato.start(t);
          vibrato.stop(t + noteLength);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.024); // brass attack
          g.gain.setValueAtTime(baseVol, t + noteLength - 0.1);
          g.gain.linearRampToValueAtTime(0.0001, t + noteLength);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          osc1.start(t);
          osc1.stop(t + noteLength + 0.05);
          osc2.start(t);
          osc2.stop(t + noteLength + 0.05);
          break;
        }
        case "accordion": {
          // Highly authentic Balkan accordion: Multi-reed musette squeal with bellows tremolo
          const baseVol = 0.05 * vel;
          const oscMain = ctx.createOscillator();
          const oscMusSharp = ctx.createOscillator();
          const oscMusFlat = ctx.createOscillator();
          const oscBassoon = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          oscMain.type = "triangle";
          oscMain.frequency.value = f;

          oscMusSharp.type = "sawtooth";
          oscMusSharp.frequency.value = f * 1.0085; // musette sharp reed (+9 cents)

          oscMusFlat.type = "sawtooth";
          oscMusFlat.frequency.value = f * 0.9915; // musette flat reed (-9 cents)

          oscBassoon.type = "sine";
          oscBassoon.frequency.value = f * 0.5; // lower octave registration

          filter.type = "lowpass";
          filter.frequency.value = 1450;
          
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.035); // bellows squeeze attack
          g.gain.setValueAtTime(baseVol, t + noteLength - 0.08);
          g.gain.linearRampToValueAtTime(0.0001, t + noteLength);

          oscMain.connect(filter);
          oscMusSharp.connect(filter);
          oscMusFlat.connect(filter);
          oscBassoon.connect(g);

          filter.connect(g);
          g.connect(masterGain);

          oscMain.start(t);
          oscMusSharp.start(t);
          oscMusFlat.start(t);
          oscBassoon.start(t);

          oscMain.stop(t + noteLength + 0.05);
          oscMusSharp.stop(t + noteLength + 0.05);
          oscMusFlat.stop(t + noteLength + 0.05);
          oscBassoon.stop(t + noteLength + 0.05);
          break;
        }
        case "tambura": {
          // Authentic Balkan Tambura: Steel course detuned rapid high metallic pluck
          const baseVol = 0.065 * vel;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.value = f * 0.997;
          osc2.type = "triangle";
          osc2.frequency.value = f * 1.006; // Course beating string (~10 cents detuned)

          filter.type = "highpass";
          filter.frequency.value = 200; // cut bottom mud completely for metal texture

          // Sharp metallic pick-striking high frequency burst
          const pick = ctx.createBufferSource();
          pick.buffer = getNoiseBuffer();
          const pickFilter = ctx.createBiquadFilter();
          pickFilter.type = "bandpass";
          pickFilter.frequency.value = 4200;
          pickFilter.Q.value = 2.5;
          const pickG = ctx.createGain();
          pickG.gain.setValueAtTime(baseVol * 0.9, t);
          pickG.gain.exponentialRampToValueAtTime(0.0001, t + 0.006);
          pick.connect(pickFilter);
          pickFilter.connect(pickG);
          pickG.connect(masterGain);
          pick.start(t);
          pick.stop(t + 0.012);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.0035);
          g.gain.exponentialRampToValueAtTime(baseVol * 0.15, t + 0.07);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength * 0.75);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          osc1.start(t);
          osc1.stop(t + noteLength + 0.05);
          osc2.start(t);
          osc2.stop(t + noteLength + 0.05);
          break;
        }
        case "djembe": {
          // High-fidelity ethnic skin percussion
          const baseVol = 0.18 * vel;
          
          // Skin low tone bounce/thud (sine pitch sweep drops to floor)
          const oscThud = ctx.createOscillator();
          const gThud = ctx.createGain();
          oscThud.type = "sine";
          oscThud.frequency.setValueAtTime(f * 0.7, t);
          oscThud.frequency.exponentialRampToValueAtTime(45, t + 0.08);

          gThud.gain.setValueAtTime(0, t);
          gThud.gain.linearRampToValueAtTime(baseVol * 1.2, t + 0.003);
          gThud.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

          oscThud.connect(gThud);
          gThud.connect(masterGain);
          oscThud.start(t);
          oscThud.stop(t + 0.2);

          // Skin ring edge slap
          const oscSlap = ctx.createOscillator();
          const gSlap = ctx.createGain();
          oscSlap.type = "triangle";
          oscSlap.frequency.setValueAtTime(f * 3.5, t);
          oscSlap.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.04);

          gSlap.gain.setValueAtTime(0, t);
          gSlap.gain.linearRampToValueAtTime(baseVol * 0.61, t + 0.002);
          gSlap.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

          oscSlap.connect(gSlap);
          gSlap.connect(masterGain);
          oscSlap.start(t);
          oscSlap.stop(t + 0.08);
          break;
        }
        case "ukulele": {
          // Sweet tiny bright nylon uke chords
          const baseVol = 0.06 * vel;
          const oscMain = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          oscMain.type = "triangle";
          oscMain.frequency.value = f;

          filter.type = "highpass";
          filter.frequency.value = 280; // tiny woody resonance

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength * 0.65);

          oscMain.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          oscMain.start(t);
          oscMain.stop(t + noteLength + 0.05);
          break;
        }
        case "strings": {
          // Slow cinematic lush bowed strings ensemble
          const baseVol = 0.04 * vel;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.value = f * 0.995;
          osc2.type = "sawtooth";
          osc2.frequency.value = f * 1.005;

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(f * 2.8, t);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.180); // slow bow attack
          g.gain.setValueAtTime(baseVol, t + noteLength - 0.12);
          g.gain.linearRampToValueAtTime(0.0001, t + noteLength);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          osc1.start(t);
          osc1.stop(t + noteLength + 0.05);
          osc2.start(t);
          osc2.stop(t + noteLength + 0.05);
          break;
        }
        case "synth": {
          // Lush retro cosmic supersaw wave
          const baseVol = 0.038 * vel;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const osc3 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.value = f;
          osc2.type = "sawtooth";
          osc2.frequency.value = f * 0.994;
          osc3.type = "sawtooth";
          osc3.frequency.value = f * 1.006;

          filter.type = "lowpass";
          filter.Q.value = 1.8;
          filter.frequency.setValueAtTime(f * 2.0, t);
          filter.frequency.linearRampToValueAtTime(f * 6.5, t + 0.18);
          filter.frequency.exponentialRampToValueAtTime(f * 2.5, t + noteLength);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength);

          osc1.connect(filter);
          osc2.connect(filter);
          osc3.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          osc1.start(t);
          osc1.stop(t + noteLength + 0.05);
          osc2.start(t);
          osc2.stop(t + noteLength + 0.05);
          osc3.start(t);
          osc3.stop(t + noteLength + 0.05);
          break;
        }
        case "bass": {
          // Deep punchy bassline routine root
          const baseVol = 0.08 * vel;
          const oscSine = ctx.createOscillator();
          const oscSaw = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          oscSine.type = "sine";
          oscSine.frequency.value = f * 0.5; // sub octave frequency

          oscSaw.type = "sawtooth";
          oscSaw.frequency.value = f * 0.5;

          filter.type = "lowpass";
          filter.frequency.value = 175;

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength * 0.85);

          oscSine.connect(filter);
          oscSaw.connect(filter);
          filter.connect(g);
          g.connect(masterGain);

          oscSine.start(t);
          oscSine.stop(t + noteLength + 0.05);
          oscSaw.start(t);
          oscSaw.stop(t + noteLength + 0.05);
          break;
        }
        default: {
          // Standard polyphonic fallback sine
          const baseVol = 0.07 * vel;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = f;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(baseVol, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + noteLength);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(t);
          osc.stop(t + noteLength + 0.05);
          break;
        }
      }
    };

    const intervals = chordIntervals(q);
    // Dynamic guitar-style chord voicing to give fullness across registers:
    const chordVoicing = [
      s - 12,                  // Bass Root
      s + intervals[0],        // Center Root
      s + intervals[1],        // Center Third
      s + intervals[2],        // Center Fifth
      s + intervals[0] + 12,   // Treble Root
      s + intervals[2] + 12    // Treble Fifth
    ];

    instrumentsToPlay.forEach((instId) => {
      if (pat === "block") {
        // Simple full block strike on beat 0
        chordVoicing.forEach((semi) => {
          playChordNote(semi, ctx.currentTime, d * 0.85, 0.75, instId);
        });
      } else if (pat === "arpeggio") {
        // Staggered arpeggio rising sequence and back
        chordVoicing.forEach((semi, index) => {
          const triggerTime = ctx.currentTime + index * 0.11;
          const decay = Math.max(0.3, d - index * 0.11);
          playChordNote(semi, triggerTime, decay * 0.8, 0.85, instId);
        });
      } else if (pat === "strum") {
        // Classic acoustic strum pattern across beats
        const strumDelay = 0.025;
        // Beat 1 (Downstrum)
        chordVoicing.forEach((semi, idx) => {
          playChordNote(semi, ctx.currentTime + idx * strumDelay, beatDur * 0.95, 0.9, instId);
        });
        // Beat 2 (Soft high plucks)
        if (activeBeatsPerBar >= 3) {
          chordVoicing.slice(2, 5).forEach((semi, idx) => {
            playChordNote(semi, ctx.currentTime + beatDur + idx * 0.01, beatDur * 0.5, 0.65, instId);
          });
        }
        // Beat 2.5 (Upstrum)
        if (activeBeatsPerBar >= 3) {
          chordVoicing.slice(1, 4).reverse().forEach((semi, idx) => {
            playChordNote(semi, ctx.currentTime + beatDur * 1.5 + idx * 0.02, beatDur * 0.4, 0.75, instId);
          });
        }
        // Beat 3 (Downstrum)
        if (activeBeatsPerBar >= 3) {
          chordVoicing.forEach((semi, idx) => {
            playChordNote(semi, ctx.currentTime + beatDur * 2 + idx * strumDelay, beatDur * 0.95, 0.85, instId);
          });
        }
        // Beat 4 (Treble high pluck)
        if (activeBeatsPerBar >= 4) {
          chordVoicing.slice(3, 6).forEach((semi, idx) => {
            playChordNote(semi, ctx.currentTime + beatDur * 3 + idx * 0.01, beatDur * 0.9, 0.7, instId);
          });
        }
      } else if (pat === "balkan_7_8") {
        // Folk Balkan 7/8 rhythm (grouped as 3 + 2 + 2 subbeats)
        const e = d / 7;
        const subBeats = [
          { off: 0, vel: 1.25 }, // Beat 1 (weighted accent, start of 3)
          { off: 3 * e, vel: 0.85 }, // Beat 2 (short step, start of 2)
          { off: 5 * e, vel: 1.0 }  // Beat 3 (short step, start of 2)
        ];
        subBeats.forEach((sb) => {
          const t = ctx.currentTime + sb.off;
          const strokeDelay = 0.015;
          chordVoicing.forEach((semi, idx) => {
            playChordNote(semi, t + idx * strokeDelay, e * 1.5, sb.vel, instId);
          });
        });
      } else if (pat === "balkan_9_8") {
        // Traditional Balkan 9/8 rhythm (grouped as 2 + 2 + 2 + 3 subbeats)
        const e = d / 9;
        const subBeats = [
          { off: 0, vel: 0.9 }, // short 2
          { off: 2 * e, vel: 0.85 }, // short 2
          { off: 4 * e, vel: 0.9 }, // short 2
          { off: 6 * e, vel: 1.35 }  // long heavy dragging 3 (strong folk dance stomp)
        ];
        subBeats.forEach((sb) => {
          const t = ctx.currentTime + sb.off;
          const strokeDelay = 0.014;
          chordVoicing.forEach((semi, idx) => {
            playChordNote(semi, t + idx * strokeDelay, e * 1.6, sb.vel, instId);
          });
        });
      } else if (pat === "reggae") {
        // Deep offbeat skank triggers chord strictly on half beats ("the AND")
        for (let idx = 0; idx < activeBeatsPerBar; idx++) {
          const t = ctx.currentTime + beatDur * (idx + 0.45);
          chordVoicing.slice(1, 5).forEach((semi) => {
            playChordNote(semi, t, 0.08, 0.95, instId);
          });
        }
      } else if (pat === "rumba") {
        // Campfire Flamenco / Pop Rumba syncopation
        const triggers = [
          { off: 0, vel: 1.2 },
          { off: beatDur * 0.75, vel: 0.75 },
          { off: beatDur * 1.5, vel: 0.85 },
          { off: beatDur * 2.25, vel: 1.1 }, // Syncopated slap/downaccent
          { off: beatDur * 3.0, vel: 0.85 }
        ];
        triggers.forEach((tr) => {
          if (tr.off < d) {
            const t = ctx.currentTime + tr.off;
            const strDelay = 0.02;
            chordVoicing.forEach((semi, idx) => {
              playChordNote(semi, t + idx * strDelay, beatDur * 0.6, tr.vel, instId);
            });
          }
        });
      } else if (pat === "waltz") {
        // Waltz 3/4 (Boom-chic-chic)
        // Beat 1 (Boom): Bass string octave
        chordVoicing.slice(0, 2).forEach((semi) => {
          playChordNote(semi, ctx.currentTime, beatDur * 0.9, 1.25, instId);
        });
        // Beat 2 (Chic): Treble chords
        chordVoicing.slice(2, 6).forEach((semi) => {
          playChordNote(semi, ctx.currentTime + beatDur, beatDur * 0.75, 0.85, instId);
        });
        // Beat 3 (Chic): Treble chords
        chordVoicing.slice(2, 6).forEach((semi) => {
          playChordNote(semi, ctx.currentTime + beatDur * 2, beatDur * 0.75, 0.85, instId);
        });
      }
    }); // closes instrumentsToPlay.forEach
  };

  const toggleInstrument = (instId: string) => {
    setActiveInstruments((prev) => {
      const isCurrentlyActive = prev.includes(instId);
      if (isCurrentlyActive) {
        if (prev.length <= 1) {
          showToast("Es muss mindestens ein Instrument ausgewählt sein!");
          return prev;
        }
        const updated = prev.filter(id => id !== instId);
        setCurrentInst(updated[0] || "piano");
        return updated;
      } else {
        const updated = [...prev, instId];
        setCurrentInst(instId);
        return updated;
      }
    });
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

  // Save, Load, and Delete Song helpers
  const handleSaveSong = () => {
    if (!timeline.length) {
      showToast("Die Timeline ist leer! Füge Akkorde hinzu, um sie zu speichern.");
      return;
    }
    const nameToUse = newSongName.trim() || `Song vom ${new Date().toLocaleDateString("de-DE")}`;
    const newSong = {
      id: "song_" + Date.now(),
      name: nameToUse,
      timeline: timeline.map(item => ({
        ...item,
        // Ensure audioBuffer (which is non-serializable) is discarded
        audioBuffer: null
      })),
      bpm,
      beatsPerBar,
      currentInst,
      activeInstruments,
      strumPattern,
      drumPattern,
      bassPattern,
      drumsOn,
      basslineOn,
      pedalboard: JSON.parse(JSON.stringify(pedalboard))
    };
    setSavedSongs(prev => [...prev.filter(s => s.name !== nameToUse), newSong]);
    setNewSongName("");
    showToast(`Song "${nameToUse}" gespeichert! 📁`);
  };

  const handleLoadSong = (song: any) => {
    if (!song) return;
    setSelectedTimelineItem(null);
    clearTimeline();
    
    // De-serialize states
    if (song.timeline) {
      setTimeline(song.timeline);
    }
    if (song.bpm) setBpm(song.bpm);
    if (song.beatsPerBar) setBeatsPerBar(song.beatsPerBar);
    if (song.currentInst) setCurrentInst(song.currentInst);
    if (song.activeInstruments) {
      setActiveInstruments(song.activeInstruments);
    } else if (song.currentInst) {
      setActiveInstruments([song.currentInst]);
    }
    if (song.strumPattern) setStrumPattern(song.strumPattern);
    if (song.drumPattern) setDrumPattern(song.drumPattern);
    if (song.bassPattern) setBassPattern(song.bassPattern);
    if (song.drumsOn !== undefined) setDrumsOn(song.drumsOn);
    if (song.basslineOn !== undefined) setBasslineOn(song.basslineOn);
    if (song.pedalboard) {
      setPedalboard(song.pedalboard);
    }
    
    showToast(`Song "${song.name}" geladen! 📁`);
  };

  const handleDeleteSong = (songId: string) => {
    setSavedSongs(prev => prev.filter(s => s.id !== songId));
    showToast("Song gelöscht! 🗑️");
  };

  const updateTimelineItemProps = (id: number, props: Partial<TimelineItem>) => {
    setTimeline(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...props };
        if (selectedTimelineItem && selectedTimelineItem.id === id) {
          setSelectedTimelineItem(updated);
        }
        return updated;
      }
      return item;
    }));
  };

  const clearTimeline = () => {
    setSelectedTimelineItem(null);
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
      activeInstruments,
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
    
    const currentTimeline = timelineRef.current;
    const hasRecordings = currentTimeline.some(item => item.type === "recording");
    const isTooLong = text.length > 2000;

    if (isTooLong || hasRecordings) {
      if (isTooLong && hasRecordings) {
        setWhatsAppWarningReason("both");
      } else if (hasRecordings) {
        setWhatsAppWarningReason("recordings");
      } else {
        setWhatsAppWarningReason("length");
      }
      setWhatsAppWarningModalOpen(true);
      
      // Auto-copy to clipboard as safe backup
      navigator.clipboard.writeText(text)
        .then(() => {
          showToast("Akkord-Code wurde in die Zwischenablage kopiert! 📋");
        })
        .catch(() => {});
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    }
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
        if (imported.activeInstruments && Array.isArray(imported.activeInstruments)) {
          setActiveInstruments(imported.activeInstruments);
        } else if (typeof imported.currentInst === "string") {
          setActiveInstruments([imported.currentInst]);
        }
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
    const stepBpm = item.bpmOverride || bpm;
    const beatDur = 60 / stepBpm;
    const barDur = beatDur * beatsPerBar;
    const now = audioContextRef.current?.currentTime ?? 0;

    // Apply master dynamic gain automation of this step
    const masterGain = masterGainRef.current;
    const baseGainVal = 0.8;
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(now);
      
      let targetGain = baseGainVal;
      if (item.dynamic === "piano") {
        targetGain = baseGainVal * 0.4;
        masterGain.gain.setValueAtTime(targetGain, now);
      } else if (item.dynamic === "forte") {
        targetGain = baseGainVal * 1.5;
        masterGain.gain.setValueAtTime(targetGain, now);
      } else if (item.dynamic === "crescendo") {
        masterGain.gain.setValueAtTime(baseGainVal * 0.15, now);
        masterGain.gain.linearRampToValueAtTime(baseGainVal * 1.5, now + barDur);
      } else if (item.dynamic === "decrescendo") {
        masterGain.gain.setValueAtTime(baseGainVal * 1.5, now);
        masterGain.gain.linearRampToValueAtTime(baseGainVal * 0.12, now + barDur);
      } else if (item.dynamic === "break") {
        masterGain.gain.setValueAtTime(0, now);
      } else {
        masterGain.gain.setValueAtTime(baseGainVal, now);
      }
    }

    if (item.type === "label") {
      playTimeoutRef.current = setTimeout(() => {
        setPlayIdx((prev) => (prev + 1) >= currentTimeline.length ? 0 : prev + 1);
      }, 300) as any;
      return;
    }

    if (item.type === "recording") {
      if (item.audioBuffer) {
        const ctx = audioContextRef.current;
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
      const activeStrum = item.strumOverride || strumPattern;

      if (item.technique !== "break" && item.dynamic !== "break") {
        playChordInst(item.semitone, item.quality, barDur * 0.85, activeStrum);
        
        // Backing band plays only if technique is NOT "hold"
        if (item.technique !== "hold") {
          if (basslineOn) scheduleBassPattern(item.semitone, item.quality, now, barDur);
          if (drumsOn) scheduleDrumPattern(now, barDur);
          if (activeStrum === "strum") {
            for (let b = 0; b < beatsPerBar; b++) {
              playChuck(now + beatDur * (b + 0.5));
            }
          }
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
    if (p.fxPresetId) {
      const selected = FX_PRESETS.find((x) => x.id === p.fxPresetId);
      if (selected) {
        setPedalboard({
          overdrive: { ...selected.settings.overdrive },
          chorus: { ...selected.settings.chorus },
          delay: { ...selected.settings.delay },
          reverb: { ...selected.settings.reverb }
        });
      } else if (p.pedalboard) {
        setPedalboard({
          overdrive: { ...pedalboard.overdrive, ...p.pedalboard.overdrive, active: p.pedalboard.overdrive?.active ?? false },
          chorus: { ...pedalboard.chorus, ...p.pedalboard.chorus, active: p.pedalboard.chorus?.active ?? false },
          delay: { ...pedalboard.delay, ...p.pedalboard.delay, active: p.pedalboard.delay?.active ?? false },
          reverb: { ...pedalboard.reverb, ...p.pedalboard.reverb, active: p.pedalboard.reverb?.active ?? false }
        });
      }
    } else if (p.pedalboard) {
      setPedalboard({
        overdrive: { ...pedalboard.overdrive, ...p.pedalboard.overdrive, active: p.pedalboard.overdrive?.active ?? false },
        chorus: { ...pedalboard.chorus, ...p.pedalboard.chorus, active: p.pedalboard.chorus?.active ?? false },
        delay: { ...pedalboard.delay, ...p.pedalboard.delay, active: p.pedalboard.delay?.active ?? false },
        reverb: { ...pedalboard.reverb, ...p.pedalboard.reverb, active: p.pedalboard.reverb?.active ?? false }
      });
    }

    setTab("songwriter");
    const styleLabel = p.strumPattern === "strum" ? "Zupfen" : p.strumPattern === "arpeggio" ? "Arpeggio" : "Block";
    const presetObj = p.fxPresetId ? FX_PRESETS.find((x) => x.id === p.fxPresetId) : null;
    const fxLabel = presetObj ? `, FX: ${presetObj.name}` : "";
    const extraInfo = p.bpm ? ` (${p.bpm} BPM, ${styleLabel}${fxLabel})` : "";
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
    <div className={`bg-[#1a1008] text-[#f0e0cc] min-h-screen font-sans relative overflow-x-hidden pb-96 transition-colors duration-300 ${isLightMode ? "light-theme" : ""}`}>
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
          <div className="text-center md:text-left flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4943c] to-[#a0681c] flex items-center justify-center text-[#1a1008] shadow-[0_4px_12px_rgba(212,148,60,0.25)] ring-1 ring-[#d4943c]/30 shrink-0">
              <Disc size={22} className="animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black tracking-tight text-[#d4943c] font-serif pr-2 leading-none">
                QuintCircleStudio
              </h1>
              <p className="text-xs text-[#7a6a58] font-mono tracking-wider uppercase mt-1">
                Songwriter's Toolkit & Circle of Fifths
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              title={isLightMode ? "Dunkelmodus aktivieren" : "Hellmodus aktivieren"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#2a1e10] border border-[#4a3828] text-[#c8b8a4] hover:border-[#d4943c] hover:text-[#f0e0cc] transition-all cursor-pointer"
            >
              {isLightMode ? (
                <>
                  <Moon size={14} className="text-[#d4943c]" />
                  <span>Dunkel</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-[#d4943c]" />
                  <span>Hell</span>
                </>
              )}
            </button>
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
                      {/* EIGENE KREATIONEN & SAVE PANEL */}
                      <div className="bg-[#120a05] border border-[#d4943c]/20 p-2.5 rounded-xl mb-1">
                        <span className="block text-[10px] font-mono text-[#d4943c] uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                          💾 Song-Grid speichern
                        </span>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Mein neuer Song..."
                            value={newSongName}
                            onChange={(e) => setNewSongName(e.target.value)}
                            className="bg-[#1a1008] border border-[#4a3828] text-xs text-[#c8b8a4] placeholder:text-[#5a4e40] px-2 py-1.5 rounded-lg focus:outline-none focus:border-[#d4943c] flex-grow font-sans min-w-0"
                          />
                          <button
                            onClick={handleSaveSong}
                            title="Speichere deine eigene Progression lokal"
                            className="bg-[#d4943c] hover:bg-[#b0782a] text-[#120a05] font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shrink-0 duration-150"
                          >
                            Sichern
                          </button>
                        </div>
                      </div>

                      {savedSongs.length > 0 && (
                        <div className="bg-[#1a1008]/40 border border-[#4a3828]/20 rounded-xl p-2">
                          <span className="block text-[10px] font-mono text-[#7a6a58] uppercase tracking-wider mb-2 font-bold">
                            📁 Eigene Songs ({savedSongs.length})
                          </span>
                          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-thin">
                            {savedSongs.map((song) => (
                              <div
                                key={song.id}
                                className="group flex items-center justify-between bg-[#120a05] border border-[#3a2818]/40 p-2 rounded-lg transition-all hover:border-[#d4943c]/30"
                              >
                                <div className="text-left overflow-hidden min-w-0 pr-1">
                                  <span className="block text-xs font-bold text-[#c8b8a4] group-hover:text-[#d4943c] truncate">
                                    {song.name}
                                  </span>
                                  <span className="block text-[8px] font-mono text-[#7a6a58] mt-0.5">
                                    {song.bpm} BPM • {song.timeline ? song.timeline.filter((ch: any) => ch.type === "chord").length : 0} Chords
                                  </span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => handleLoadSong(song)}
                                    className="text-[9px] font-bold bg-[#d4943c]/10 text-[#d4943c] hover:bg-[#d4943c] hover:text-[#120a05] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Laden
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSong(song.id)}
                                    className="text-[9px] font-bold bg-[#b84a32]/10 text-[#b84a32] hover:bg-[#b84a32] hover:text-white px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                    title="Löschen"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

                        {/* Preset Pedalboard FX active lights with FX Preset Name */}
                        {p.pedalboard && (() => {
                          const fxPreset = p.fxPresetId ? FX_PRESETS.find((x) => x.id === p.fxPresetId) : null;
                          return (
                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                              {fxPreset && (
                                <div className="flex items-center gap-1.5 bg-[#120a05] text-[10px] text-[#c8b8a4] px-2.5 py-1 rounded-lg border border-[#4a3828]/40 font-mono font-bold whitespace-nowrap">
                                  <span className="text-[#a89880]">Sound:</span>
                                  <span>{fxPreset.icon}</span>
                                  <span className="text-[#d4943c] truncate max-w-[150px]">{fxPreset.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 bg-[#120a05] px-2 py-1 rounded-lg border border-[#4a3828]/40">
                                <span className={`px-1 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.overdrive?.active ? 'text-[#e85c33] bg-[#e85c33]/15 font-bold border border-[#e85c33]/20' : 'opacity-25'}`}>⚡ OD</span>
                                <span className={`px-1 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.chorus?.active ? 'text-[#3393e8] bg-[#3393e8]/15 font-bold border border-[#3393e8]/20' : 'opacity-25'}`}>🌀 Cho</span>
                                <span className={`px-1 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.delay?.active ? 'text-[#33e8a3] bg-[#33e8a3]/15 font-bold border border-[#33e8a3]/20' : 'opacity-25'}`}>⏳ Dly</span>
                                <span className={`px-1 py-0.5 rounded text-[9px] flex items-center gap-0.5 ${p.pedalboard.reverb?.active ? 'text-[#a333e8] bg-[#a333e8]/15 font-bold border border-[#a333e8]/20' : 'opacity-25'}`}>🌌 Rev</span>
                              </div>
                            </div>
                          );
                        })()}

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

              <div className="rounded-2xl bg-[#2a1e10] border border-[#4a3828] p-6 text-center shadow-xl relative overflow-hidden">
                {/* Visual Feedback Glowing Backwash */}
                {tunerNote !== "-" && (
                  <div 
                    className={`absolute inset-0 pointer-events-none transition-opacity duration-300 -z-10 opacity-15 filter blur-3xl ${
                      Math.abs(tunerCents) <= 3 
                        ? "bg-[#4a9e5c]" 
                        : Math.abs(tunerCents) <= 15 
                        ? "bg-[#d4943c]" 
                        : "bg-[#b84a32]"
                    }`}
                  />
                )}

                {/* Sub-Cent High Precision Arch Dial */}
                <div className="relative h-32 w-full flex items-center justify-center mb-1">
                  <svg viewBox="0 0 300 150" className="w-full max-w-[250px]">
                    <defs>
                      <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#b84a32" />
                        <stop offset="35%" stopColor="#d4943c" />
                        <stop offset="47%" stopColor="#4a9e5c" />
                        <stop offset="53%" stopColor="#4a9e5c" />
                        <stop offset="65%" stopColor="#d4943c" />
                        <stop offset="100%" stopColor="#b84a32" />
                      </linearGradient>
                    </defs>

                    {/* Outer Color Gradient Guide Arch */}
                    <path
                      d="M 40 135 A 100 100 0 0 1 260 135"
                      fill="none"
                      stroke="url(#dialGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      opacity="0.85"
                    />

                    {/* Dark backing base arc */}
                    <path
                      d="M 44 135 A 96 96 0 0 1 256 135"
                      fill="none"
                      stroke="#1c1209"
                      strokeWidth="1"
                      strokeDasharray="2,3"
                      opacity="0.4"
                    />

                    {/* Tick Generation */}
                    {Array.from({ length: 21 }).map((_, idx) => {
                      const c = -50 + idx * 5;
                      const angleDeg = (c / 50) * 45;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      const isMajor = c % 10 === 0;
                      const isCenter = c === 0;
                      
                      const rOuter = 110;
                      const rInner = isMajor ? 97 : 103;
                      
                      const x1 = 150 + rInner * Math.sin(angleRad);
                      const y1 = 135 - rInner * Math.cos(angleRad);
                      const x2 = 150 + rOuter * Math.sin(angleRad);
                      const y2 = 135 - rOuter * Math.cos(angleRad);

                      let strokeColor = "#4a3828";
                      if (tunerNote !== "-") {
                        if (isCenter && Math.abs(tunerCents) <= 3) {
                          strokeColor = "#52c46c";
                        } else if (Math.abs(tunerCents - c) <= 2.5) {
                          strokeColor = Math.abs(c) <= 3 ? "#4a9e5c" : Math.abs(c) <= 15 ? "#d4943c" : "#b84a32";
                        }
                      }

                      return (
                        <g key={c}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth={isMajor ? (isCenter ? 3 : 2) : 1}
                            strokeLinecap="round"
                            className="transition-all duration-150"
                          />
                          {isMajor && (
                            <text
                              x={150 + 120 * Math.sin(angleRad)}
                              y={135 - 120 * Math.cos(angleRad) + 3}
                              fill={isCenter ? "#4a9e5c" : Math.abs(c) <= 15 ? "#7a6a58" : "#5a4a3a"}
                              fontSize="7.5"
                              fontWeight={isCenter ? "black" : "bold"}
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {isCenter ? "MID" : c > 0 ? `+${c}` : c}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Cent Highlight Center Shield */}
                    <g transform="translate(150, 135)">
                      <circle cx="0" cy="0" r="14" fill="#120a04" stroke="#4a3828" strokeWidth="1" />
                      <circle cx="0" cy="0" r="5" fill={tunerNote !== "-" && Math.abs(tunerCents) <= 3 ? "#4a9e5c" : "#d4943c"} />
                    </g>

                    {/* Main Needle */}
                    <line
                      x1="150"
                      y1="135"
                      x2="150"
                      y2="36"
                      stroke={tunerNote !== "-" ? (Math.abs(tunerCents) <= 3 ? "#4a9e5c" : "#d4943c") : "#5a4a3a"}
                      strokeWidth={Math.abs(tunerCents) <= 3 && tunerNote !== "-" ? 3.5 : 2.5}
                      strokeLinecap="round"
                      style={{
                        transform: `rotate(${(tunerCents / 50) * 45}deg)`,
                        transformOrigin: "150px 135px",
                        transition: "transform 0.08s cubic-bezier(0.1, 0.8, 0.3, 1)"
                      }}
                    />
                  </svg>
                </div>

                {/* Sub-Cent Digital Strobe-Indicator */}
                <div className="flex flex-col items-center justify-center my-3">
                  {/* Note block & Status light */}
                  <div className="relative inline-flex items-center justify-center">
                    <div className="text-6xl font-serif font-black text-[#f0e0cc] tracking-tighter transition-all duration-150 select-none">
                      {tunerNote}
                    </div>
                    {/* Perfect in-tune LOCK symbol indicator */}
                    {tunerNote !== "-" && Math.abs(tunerCents) <= 3 && (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -right-8 -top-1 bg-[#153018] border border-[#4a9e5c]/60 text-[#4a9e5c] text-[8px] font-mono font-black py-0.5 px-1.5 rounded-full select-none"
                      >
                        LOCK ✓
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Realtime Fine-Tuning Calibration Matrix */}
                <div className="mb-4 px-2.5 py-2 bg-[#120a04] border border-[#4a3828]/45 rounded-xl">
                  {/* Direction hints */}
                  <div className="flex justify-between items-center text-[8.5px] font-mono text-[#7a6a58] uppercase mb-1.5 font-black tracking-wider">
                    <span className={tunerCents < -3 && tunerNote !== "-" ? "text-red-400" : ""}>♭ FLAT</span>
                    <span className={Math.abs(tunerCents) <= 3 && tunerNote !== "-" ? "text-[#4a9e5c] animate-pulse" : ""}>
                      {tunerNote !== "-" ? (Math.abs(tunerCents) <= 3 ? "PERFEKT STIMMT" : `${Math.abs(tunerCents)} CENT ABWEICHUNG`) : "MESSBEREIT"}
                    </span>
                    <span className={tunerCents > 3 && tunerNote !== "-" ? "text-red-400" : ""}>♯ SHARP</span>
                  </div>

                  {/* Progressive Micro-Cent Tuning LED indicator grid */}
                  <div className="relative h-5 flex items-center justify-between gap-0.5 rounded-lg overflow-hidden bg-[#0d0702] px-1 border border-[#302014]">
                    {/* Perfect vertical center focus overlay lines */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-[#4a9e5c] z-20 shadow-[0_0_8px_#4a9e5c]" />
                    <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 text-[6px] text-[#4a9e5c] z-30 font-bold select-none">▼</div>

                    {Array.from({ length: 25 }).map((_, i) => {
                      const ledCentForSlot = -50 + i * 4.16;
                      const isLedInCenterZone = Math.abs(ledCentForSlot) <= 4;
                      
                      let activeState = false;
                      if (tunerNote !== "-") {
                        if (tunerCents === 0 && isLedInCenterZone) {
                          activeState = true;
                        } else if (tunerCents > 0 && ledCentForSlot > 0 && ledCentForSlot <= tunerCents) {
                          activeState = true;
                        } else if (tunerCents < 0 && ledCentForSlot < 0 && ledCentForSlot >= tunerCents) {
                          activeState = true;
                        }
                      }
                      
                      let barColorClass = "bg-[#251810]";
                      if (activeState) {
                        if (isLedInCenterZone) {
                          barColorClass = "bg-[#4a9e5c] shadow-[0_0_8px_#4a9e5c]";
                        } else if (Math.abs(ledCentForSlot) <= 15) {
                          barColorClass = "bg-[#d4943c] shadow-[0_0_6px_#d4943c]";
                        } else {
                          barColorClass = "bg-[#b84a32] shadow-[0_0_6px_#b84a32]";
                        }
                      } else if (isLedInCenterZone) {
                        barColorClass = "bg-[#18301d]/60";
                      }
                      
                      return (
                        <div
                          key={i}
                          className={`h-3 flex-grow rounded-[1px] transition-all duration-100 ${barColorClass}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Numeric Readings Dashboard */}
                <div className="flex justify-center gap-6 text-[11px] text-[#7a6a58] font-mono border-t border-b border-[#4a3828]/40 py-2.5 mb-5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#c8b8a4]">Diff:</span>
                    <span className={`font-black tracking-tight ${tunerNote === "-" ? "text-[#7a6a58]" : Math.abs(tunerCents) <= 3 ? "text-[#4a9e5c]" : "text-[#d4943c]"}`}>
                      {tunerNote === "-" ? "--" : tunerCents > 0 ? `+${tunerCents} ct` : `${tunerCents} ct`}
                    </span>
                  </div>
                  <div className="w-[1px] bg-[#4a3828]/40 h-3" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#c8b8a4]">Frequenz:</span>
                    <span className="font-bold text-[#d4943c]">
                      {tunerHz > 0 ? `${tunerHz.toFixed(1)} Hz` : "--- Hz"}
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
                            <a
                              href={rec.url}
                              download={`${rec.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.webm`}
                              className="px-2.5 py-1 text-[10px] font-bold bg-[#4a9e5c]/15 border border-[#4a9e5c]/30 text-[#6fc888] hover:bg-[#4a9e5c] hover:text-white rounded transition-all cursor-pointer flex items-center gap-1 text-center no-underline"
                              title="Diese Tonaufnahme als Datei herunterladen, um sie per WhatsApp zu versenden"
                            >
                              <Download size={11} /> Herunterladen
                            </a>
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
      <footer className="fixed bottom-0 left-0 right-0 bg-[#2a1e10] border-t-2 border-[#4a3828] z-40 select-none shadow-[0_-12px_35px_rgba(0,0,0,0.95)] transition-all duration-300 max-h-[92vh] flex flex-col pb-2 md:pb-4">
        {/* Full-width elegant click-to-minimize console title bar */}
        <div 
          onClick={() => setIsFooterMinimized(!isFooterMinimized)}
          className="bg-[#1a1008] border-b border-[#4a3828] px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#22160d] transition-all shrink-0 select-none"
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
            <span>QuintCircleStudio console and timeline sequencer</span>
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

        <div className="max-w-5xl w-full mx-auto px-3 sm:px-4 md:px-6 pt-2 pb-2 relative overflow-y-auto flex-1 select-none">

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
                      activeInstruments && activeInstruments.length > 0
                        ? activeInstruments.map((id) => {
                            if (id === "piano") return "🎹 Klavier";
                            if (id === "guitar") return "🎸 Classical";
                            if (id === "guitar_acoustic") return "🪕 Acoustic";
                            if (id === "guitar_electric_clean") return "🎸 Elec Clean";
                            if (id === "guitar_electric_dist") return "⚡ Heavy Dist.";
                            if (id === "sax") return "🎷 Sax";
                            if (id === "djembe") return "🪘 Djembe";
                            if (id === "ukulele") return "🪕 Ukulele";
                            if (id === "strings") return "🎻 Strings";
                            if (id === "synth") return "🎛️ Synth";
                            if (id === "bass") return "🎸 Bass";
                            if (id === "trumpet") return "🎺 Trumpet";
                            if (id === "accordion") return "🪗 Accordion";
                            if (id === "tambura") return "🪕 Tambura";
                            return id;
                          }).join(" + ")
                        : "Keine"
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
            <div className="space-y-2 sm:space-y-3 pb-2 md:pb-0">
              {/* Row 1: Sound Instruments */}
              <div className="flex flex-col gap-1.5 mb-3">
                {/* Row 1a: Acoustic & Folk Instruments */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                  <span className="text-[10px] font-mono text-[#7a6a58] uppercase font-bold pr-1 shrink-0">
                    Akustisch:
                  </span>
                  {[
                    { id: "piano", label: "Piano", icon: <Music size={11} /> },
                    { id: "guitar", label: "Classical", icon: <Guitar size={11} /> },
                    { id: "guitar_acoustic", label: "Acoustic Steel", icon: <Guitar size={11} className="text-[#f59e0b]" /> },
                    { id: "accordion", label: "Akkordeon", icon: <Sliders size={11} className="text-orange-400" /> },
                    { id: "tambura", label: "Tambura", icon: <Guitar size={11} className="text-amber-500" /> },
                    { id: "strings", label: "Strings", icon: <Waves size={11} /> },
                    { id: "ukulele", label: "Ukulele", icon: <Sliders size={11} /> }
                  ].map((inst) => {
                    const isActive = activeInstruments.includes(inst.id);
                    return (
                      <button
                        key={inst.id}
                        id={`inst-${inst.id}`}
                        onClick={() => toggleInstrument(inst.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-[#d4943c] text-[#1a1008] font-black shadow-[0_2px_8px_rgba(212,148,60,0.25)] ring-1 ring-[#d4943c]/30"
                            : "bg-[#1a1008] border border-[#4a3828]/60 text-[#7a6a58] hover:text-[#f0e0cc]"
                        }`}
                        title={isActive ? "Deaktivieren" : "Aktivieren"}
                      >
                        {inst.icon}
                        <span>{inst.label}</span>
                        {isActive && <span className="ml-0.5 text-[8.5px] text-[#1a1008]">✔</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Row 1b: Band, Wind & Electronic Instruments */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <span className="text-[10px] font-mono text-[#7a6a58] uppercase font-bold pr-1 shrink-0">
                    Band/Synth:
                  </span>
                  {[
                    { id: "guitar_electric_clean", label: "Electric Clean", icon: <Guitar size={11} className="text-cyan-400" /> },
                    { id: "guitar_electric_dist", label: "Heavy Dist.", icon: <Guitar size={11} className="text-red-500" /> },
                    { id: "sax", label: "Saxophon", icon: <Music size={11} className="text-yellow-500" /> },
                    { id: "trumpet", label: "Trompete", icon: <Volume2 size={11} className="text-amber-400" /> },
                    { id: "djembe", label: "Djembe", icon: <Drum size={11} /> },
                    { id: "synth", label: "Synth", icon: <SlidersHorizontal size={11} /> },
                    { id: "bass", label: "Bass", icon: <Volume2 size={11} /> }
                  ].map((inst) => {
                    const isActive = activeInstruments.includes(inst.id);
                    return (
                      <button
                        key={inst.id}
                        id={`inst-${inst.id}`}
                        onClick={() => toggleInstrument(inst.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-[#d4943c] text-[#1a1008] font-black shadow-[0_2px_8px_rgba(212,148,60,0.25)] ring-1 ring-[#d4943c]/30"
                            : "bg-[#1a1008] border border-[#4a3828]/60 text-[#7a6a58] hover:text-[#f0e0cc]"
                        }`}
                        title={isActive ? "Deaktivieren" : "Aktivieren"}
                      >
                        {inst.icon}
                        <span>{inst.label}</span>
                        {isActive && <span className="ml-0.5 text-[8.5px] text-[#1a1008]">✔</span>}
                      </button>
                    );
                  })}
                </div>
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
                <div className="flex items-center flex-wrap gap-2 bg-[#120a04] px-2.5 py-1.5 rounded-xl border border-[#4a3828]/40 max-w-full">
                  <span className="text-xs font-mono text-[#7a6a58] font-bold">BPM</span>
                  
                  {/* Precision micro adjusters for touch targets */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBpm((b) => Math.max(40, b - 1))}
                      title="1 BPM langsamer"
                      className="w-5 h-5 flex items-center justify-center rounded bg-[#1a1008] border border-[#4a3828] text-xs font-bold hover:text-[#d4943c] cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="40"
                      max="420"
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-20 accent-[#d4943c] cursor-ew-resize h-1 bg-[#2a1e10] rounded"
                    />
                    <button
                      onClick={() => setBpm((b) => Math.min(420, b + 1))}
                      title="1 BPM schneller"
                      className="w-5 h-5 flex items-center justify-center rounded bg-[#1a1008] border border-[#4a3828] text-xs font-bold hover:text-[#d4943c] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-xs font-mono font-extrabold text-[#d4943c] w-8 text-center bg-[#1a1008] px-1 py-0.5 rounded border border-[#4a3828]/50">
                    {bpm}
                  </span>

                  {/* Micro divider */}
                  <div className="h-4 w-px bg-[#4a3828]/50 hidden sm:block" />

                  {/* Quick BPM Presets adapted for higher range */}
                  <div className="flex flex-wrap items-center gap-1">
                    {[60, 90, 120, 180, 240, 360].map((b) => (
                      <button
                        key={b}
                        onClick={() => setBpm(b)}
                        className={`text-[9px] px-1.5 py-0.5 rounded-md border text-center transition-all cursor-pointer ${
                          bpm === b
                            ? "bg-[#d4943c]/25 border-[#d4943c] text-[#d4943c] font-black"
                            : "bg-[#1a1008] border-[#4a3828]/60 text-[#7a6a58] hover:text-[#c8b8a4]"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Advanced Drum & Bass & FX Rhythm Configs (Collapsible Space-Saving Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3 pb-2 border-b border-[#4a3828]/40 shrink-0">
                {/* Channel Strip 1: Drums System */}
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-2 sm:p-2.5 rounded-xl flex flex-col justify-between gap-1.5 shadow-inner transition-all duration-300">
                  {/* Drums Header Row */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {/* iOS style Toggle Switch */}
                      <button
                        onClick={() => {
                          initAudio();
                          const nextOn = !drumsOn;
                          setDrumsOn(nextOn);
                          if (nextOn) {
                            setDrumsExpanded(true);
                            setBassExpanded(true);
                            setDspExpanded(true);
                          }
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center shrink-0 ${
                          drumsOn ? "bg-[#4a9e5c]" : "bg-[#120a04] border border-[#4a3828]/60"
                        }`}
                        title="Drums an/aus"
                      >
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="w-4 h-4 rounded-full bg-white shadow-md"
                          style={{ x: drumsOn ? 16 : 0 }}
                        />
                      </button>
                      <div className="text-left select-none leading-none">
                        <span className="block text-xs font-bold text-[#c8b8a4]">Drums</span>
                        <span className="block text-[8px] sm:text-[9px] font-mono text-[#7a6a58] tracking-tight">
                          {drumsOn ? `${DRUM_OPTIONS.find(o => o.id === drumPattern)?.icon || ""} ${DRUM_OPTIONS.find(o => o.id === drumPattern)?.label || ""} • ${Math.round(drumsVolume * 100)}%` : "MUTED"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Expand Slider Button */}
                    <button
                      onClick={() => {
                        const target = !drumsExpanded;
                        setDrumsExpanded(target);
                        setBassExpanded(target);
                        setDspExpanded(target);
                      }}
                      className={`p-1 rounded-lg bg-[#120a04] hover:bg-[#22160d] border border-[#4a3828]/50 flex items-center justify-center transition-all cursor-pointer text-xs select-none ${
                        drumsExpanded ? "text-[#d4943c] border-[#d4943c]/70" : "text-[#7a6a58]"
                      }`}
                      title={drumsExpanded ? "Details zuklappen" : "Details aufklappen"}
                    >
                      {drumsExpanded ? <ChevronUp size={12} className="stroke-[2.5]" /> : <Sliders size={12} className="stroke-[2.5]" />}
                    </button>
                  </div>

                  {/* Drums Expanded settings */}
                  {drumsExpanded && (
                    <div className="w-full flex flex-col gap-2 pt-2 border-t border-[#4a3828]/25">
                      {/* Volume Slider Section */}
                      <div className="flex flex-col gap-1.5 w-full">
                        {/* Primary volume slider */}
                        <div className="flex items-center gap-2 bg-[#120a04]/40 px-2 py-1 rounded-xl border border-[#4a3828]/35 w-full hover:border-[#d4943c]/35 transition-colors">
                          <Volume2 size={11} className={drumsOn ? "text-[#d4943c]" : "text-neutral-600"} />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={drumsVolume}
                            onChange={(e) => setDrumsVolume(Number(e.target.value))}
                            className="w-full h-1 bg-[#2a1e10] rounded-lg border-none accent-[#d4943c] cursor-ew-resize"
                            disabled={!drumsOn}
                            title="Hauptlautstärke Drums"
                          />
                          <span className="text-[9px] font-mono font-extrabold text-[#d4943c] w-6 text-right shrink-0">
                            {Math.round(drumsVolume * 100)}%
                          </span>
                        </div>

                        {/* Desktop Pitch tuning slider */}
                        <div className="flex items-center gap-2 bg-[#120a04]/40 px-2 py-1 rounded-xl border border-[#4a3828]/15 w-full hover:border-[#d4943c]/35 transition-colors">
                          <span className="text-[8px] font-mono font-bold text-[#7a6a58] shrink-0 uppercase">Pitch:</span>
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
                          <span className="text-[9px] font-mono font-extrabold text-[#d4943c] w-6 text-right shrink-0">
                            {drumsPitch.toFixed(1)}x
                          </span>
                        </div>
                      </div>

                      {/* iOS Style Segmented Control */}
                      <div className="flex bg-[#120a04] p-0.5 rounded-lg border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none w-full relative gap-0.5 items-center">
                        {DRUM_OPTIONS.map((opt) => {
                          const isActive = drumPattern === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setDrumPattern(opt.id)}
                              className={`relative px-1.5 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap z-10 shrink-0 ${
                                isActive ? "text-[#1a1008] font-extrabold" : "text-[#7a6a58] hover:text-[#c8b8a4]"
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeDrumPill"
                                  className="absolute inset-0 bg-[#d4943c] rounded-md sm:rounded-lg -z-10 shadow-[0_2px_8px_rgba(212,148,60,0.35)]"
                                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                              )}
                              <span className="flex items-center gap-1">
                                <span className="text-xs">{opt.icon}</span>
                                <span>{opt.label}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Channel Strip 2: Bass System */}
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-2 sm:p-2.5 rounded-xl flex flex-col justify-between gap-1.5 shadow-inner transition-all duration-300">
                  {/* Bass Header Row */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {/* iOS style Toggle Switch */}
                      <button
                        onClick={() => {
                          initAudio();
                          const nextOn = !basslineOn;
                          setBasslineOn(nextOn);
                          if (nextOn) {
                            setDrumsExpanded(true);
                            setBassExpanded(true);
                            setDspExpanded(true);
                          }
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative flex items-center shrink-0 ${
                          basslineOn ? "bg-[#4a9e5c]" : "bg-[#120a04] border border-[#4a3828]/60"
                        }`}
                        title="Bass an/aus"
                      >
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="w-4 h-4 rounded-full bg-white shadow-md"
                          style={{ x: basslineOn ? 16 : 0 }}
                        />
                      </button>
                      <div className="text-left select-none leading-none">
                        <span className="block text-xs font-bold text-[#c8b8a4]">Bass-Line</span>
                        <span className="block text-[8px] sm:text-[9px] font-mono text-[#7a6a58] tracking-tight">
                          {basslineOn ? `${BASS_OPTIONS.find(o => o.id === bassPattern)?.icon || ""} ${BASS_OPTIONS.find(o => o.id === bassPattern)?.label || ""} • ${Math.round(bassVolume * 100)}%` : "MUTED"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Expand Slider Button */}
                    <button
                      onClick={() => {
                        const target = !bassExpanded;
                        setDrumsExpanded(target);
                        setBassExpanded(target);
                        setDspExpanded(target);
                      }}
                      className={`p-1 rounded-lg bg-[#120a04] hover:bg-[#22160d] border border-[#4a3828]/50 flex items-center justify-center transition-all cursor-pointer text-xs select-none ${
                        bassExpanded ? "text-[#d4943c] border-[#d4943c]/70" : "text-[#7a6a58]"
                      }`}
                      title={bassExpanded ? "Details zuklappen" : "Details aufklappen"}
                    >
                      {bassExpanded ? <ChevronUp size={12} className="stroke-[2.5]" /> : <Sliders size={12} className="stroke-[2.5]" />}
                    </button>
                  </div>

                  {/* Bass Expanded settings */}
                  {bassExpanded && (
                    <div className="w-full flex flex-col gap-2 pt-2 border-t border-[#4a3828]/25">
                      {/* Volume Slider Section */}
                      <div className="flex flex-col gap-1.5 w-full">
                        {/* Primary volume slider */}
                        <div className="flex items-center gap-2 bg-[#120a04]/40 px-2 py-1 rounded-xl border border-[#4a3828]/35 w-full hover:border-[#d4943c]/35 transition-colors">
                          <Volume2 size={11} className={basslineOn ? "text-[#d4943c]" : "text-neutral-600"} />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={bassVolume}
                            onChange={(e) => setBassVolume(Number(e.target.value))}
                            className="w-full h-1 bg-[#2a1e10] rounded-lg border-none accent-[#d4943c] cursor-ew-resize"
                            disabled={!basslineOn}
                            title="Hauptlautstärke Bass"
                          />
                          <span className="text-[9px] font-mono font-extrabold text-[#d4943c] w-6 text-right shrink-0">
                            {Math.round(bassVolume * 100)}%
                          </span>
                        </div>

                        {/* Cutoff filter sweep slider */}
                        <div className="flex items-center gap-2 bg-[#120a04]/40 px-2 py-1 rounded-xl border border-[#4a3828]/15 w-full hover:border-[#d4943c]/35 transition-colors">
                          <span className="text-[8px] font-mono font-bold text-[#7a6a58] shrink-0 uppercase">Filter:</span>
                          <input
                            type="range"
                            min="100"
                            max="1200"
                            step="10"
                            value={bassFilterCutoff}
                            onChange={(e) => setBassFilterCutoff(Number(e.target.value))}
                            className="w-full h-1 bg-[#2a1e10] rounded-lg border-none accent-[#d4943c] cursor-ew-resize opacity-65 hover:opacity-100 transition-opacity"
                            disabled={!basslineOn}
                            title="Bass Tiefpass Filter-Cutoff"
                          />
                          <span className="text-[9px] font-mono font-extrabold text-[#d4943c] w-9 text-right shrink-0 truncate">
                            {bassFilterCutoff}Hz
                          </span>
                        </div>
                      </div>

                      {/* iOS Style Segmented Control */}
                      <div className="flex bg-[#120a04] p-0.5 rounded-lg border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none w-full relative gap-0.5 items-center">
                        {BASS_OPTIONS.map((opt) => {
                          const isActive = bassPattern === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setBassPattern(opt.id)}
                              className={`relative px-1.5 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap z-10 shrink-0 ${
                                isActive ? "text-[#1a1008] font-extrabold" : "text-[#7a6a58] hover:text-[#c8b8a4]"
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeBassPill"
                                  className="absolute inset-0 bg-[#d4943c] rounded-md sm:rounded-lg -z-10 shadow-[0_2px_8px_rgba(212,148,60,0.35)]"
                                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                              )}
                              <span className="flex items-center gap-1">
                                <span className="text-xs">{opt.icon}</span>
                                <span>{opt.label}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Channel Strip 3: DSP Pedalboard Rack */}
                <div className="bg-[#1f130a] border border-[#4a3828]/50 p-2 sm:p-2.5 rounded-xl flex flex-col justify-between gap-1.5 shadow-inner transition-all duration-300 md:col-span-2 lg:col-span-1">
                  {/* DSP Header Row */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#c8b8a4] flex items-center gap-1">
                        <Sliders size={12} className="text-[#d4943c] animate-pulse shrink-0" /> DSP
                      </span>
                      <span className="text-[8px] sm:text-[9.5px] font-mono text-[#7a6a58] leading-none tracking-tight">
                        {pedalboard.overdrive.active || pedalboard.chorus.active || pedalboard.delay.active || pedalboard.reverb.active
                          ? `[ ${[
                              pedalboard.overdrive.active && "Drive",
                              pedalboard.chorus.active && "Chorus",
                              pedalboard.delay.active && "Delay",
                              pedalboard.reverb.active && "Reverb"
                            ].filter(Boolean).join(", ")} ]`
                          : "BYPASS"}
                      </span>
                    </div>

                    {/* Quick Expand Slider Button */}
                    <button
                      onClick={() => {
                        const target = !dspExpanded;
                        setDrumsExpanded(target);
                        setBassExpanded(target);
                        setDspExpanded(target);
                      }}
                      className={`p-1 rounded-lg bg-[#120a04] hover:bg-[#22160d] border border-[#4a3828]/50 flex items-center justify-center transition-all cursor-pointer text-xs select-none ${
                        dspExpanded ? "text-[#d4943c] border-[#d4943c]/70" : "text-[#7a6a58]"
                      }`}
                      title={dspExpanded ? "FX einklappen" : "FX ausklappen"}
                    >
                      {dspExpanded ? <ChevronUp size={12} className="stroke-[2.5]" /> : <Sliders size={12} className="stroke-[2.5]" />}
                    </button>
                  </div>

                  {/* DSP Expanded settings */}
                  {dspExpanded && (
                    <div className="w-full flex flex-col gap-2 pt-2 border-t border-[#4a3828]/25">
                      {/* 4 neon status stomp buttons */}
                      <div className="grid grid-cols-4 gap-1.5">
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
                            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer border ${
                              p.active 
                                ? "bg-[#120a04] border-[#d4943c] text-white font-extrabold"
                                : "bg-[#120a04]/40 border-[#4a3828]/45 text-[#7a6a58] hover:text-[#c8b8a4]"
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mb-0.5 transition-all ${p.active ? p.glowColor : "bg-neutral-800"}`} />
                            <span className="text-[7.5px] font-mono uppercase tracking-tighter">{p.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Rig selection inside channel strip */}
                      <div className="flex bg-[#120a04] p-0.5 rounded-lg border border-[#4a3828]/40 select-none overflow-x-auto scrollbar-none relative gap-0.5 items-center">
                        <span className="text-[8px] font-mono text-[#5f4e3c] px-1 sm:px-1.5 font-bold uppercase shrink-0">Rig:</span>
                        {FX_PRESETS.map((p: any) => {
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
                              className={`relative px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[8.5px] sm:text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap z-10 shrink-0 ${
                                isCurrent ? "text-[#1a1008] font-extrabold" : "text-[#7a6a58] hover:text-[#c8b8a4]"
                              }`}
                            >
                              {isCurrent && (
                                <motion.div
                                  layoutId="activeFxPillFooter"
                                  className="absolute inset-0 bg-[#d4943c] rounded-md sm:rounded-lg -z-10 shadow-[0_1px_5px_rgba(212,148,60,0.35)]"
                                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                              )}
                              <span>{p.icon} {p.name.replace("Dry ", "").replace("Warm ", "").replace("High-Gain ", "")}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                      
                      const isSelected = selectedTimelineItem?.id === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => {
                            setSelectedTimelineItem(item);
                            if (item.semitone !== undefined && item.quality) {
                              playChordInst(item.semitone, item.quality, 0.7, item.strumOverride || strumPattern);
                            }
                          }}
                          className={`flex-shrink-0 w-16 h-16 rounded-xl border flex flex-col items-center justify-center relative cursor-pointer group transition-all ${
                            isActive
                              ? "border-[#d4943c] bg-[#d4943c]/15 shadow-[0_0_12px_rgba(212,148,60,0.3)] scale-105"
                              : isSelected
                              ? "border-[#d4943c] ring-2 ring-[#d4943c]/70 bg-[#1c1209]"
                              : "border-[#4a3828] bg-[#1a1008] hover:border-[#c8b8a4]"
                          }`}
                        >
                          <span className="text-[8px] font-mono text-[#7a6a58] absolute top-1 left-2">
                            {idx + 1}
                          </span>
                          
                          {/* Speed indicator */}
                          {item.bpmOverride && (
                            <span className="text-[6.5px] font-mono text-[#d4943c] absolute top-1 right-2">
                              ⚡{item.bpmOverride}
                            </span>
                          )}

                          <span className={`text-sm font-black tracking-tight ${textCol}`}>
                            {capillaryName}
                          </span>
                          {item.roman && (
                            <span className="text-[9px] font-mono text-[#7a6a58] mt-0.5 uppercase">
                              {item.roman}
                            </span>
                          )}

                          {/* Dynamics Indicator */}
                          {item.dynamic && item.dynamic !== "normal" && (
                            <span className="text-[6px] text-emerald-400 absolute bottom-1.5 left-2 uppercase font-mono font-black scale-90">
                              {item.dynamic === "piano" ? "pp" : item.dynamic === "forte" ? "ff" : item.dynamic === "crescendo" ? "cres." : item.dynamic === "decrescendo" ? "dec." : "mut"}
                            </span>
                          )}

                          {/* Technique Indicator */}
                          {item.technique && item.technique !== "normal" && (
                            <span className="text-[6px] text-rose-400 absolute bottom-1.5 right-2 uppercase font-mono font-black scale-90">
                              {item.technique === "hold" ? "hold" : "mute"}
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
                              if (isSelected) setSelectedTimelineItem(null);
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

              {/* Row 4.5: Chord properties layout editor (Dynamic & Technique Editor) */}
              {selectedTimelineItem && (
                (() => {
                  const currentSecIdx = timeline.findIndex(ch => ch.id === selectedTimelineItem.id);
                  const selectedInTimeline = timeline[currentSecIdx];
                  if (!selectedInTimeline || selectedInTimeline.type !== "chord") return null;

                  return (
                    <div className="bg-[#20150c]/90 border border-[#d4943c]/30 rounded-xl p-3 mb-3 animate-fadeIn text-left">
                      <div className="flex items-center justify-between border-b border-[#4a3828]/50 pb-2 mb-2">
                        <span className="text-xs font-bold text-[#c8b8a4] flex items-center gap-1.5 uppercase font-mono tracking-wide">
                          ✏️ Arrangement für Schritt #{currentSecIdx + 1}: <span className="text-[#d4943c] font-black text-xs sm:text-sm">{selectedInTimeline.name}</span>
                        </span>
                        <button
                          onClick={() => setSelectedTimelineItem(null)}
                          className="text-[#7a6a58] hover:text-[#c8b8a4] text-xs font-bold cursor-pointer transition-colors px-1.5"
                        >
                          Schließen ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {/* 1. Tempo (BPM Override) */}
                        <div className="space-y-1 bg-[#120a05] p-2 rounded-lg border border-[#3a2818]/60">
                          <span className="block text-[10px] uppercase tracking-wider text-[#7a6a58] font-mono font-bold">
                            ⚡ Tempo-Änderung (BPM)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const val = selectedInTimeline.bpmOverride || bpm;
                                updateTimelineItemProps(selectedInTimeline.id, { bpmOverride: Math.max(40, val - 1) });
                              }}
                              className="w-5 h-5 flex items-center justify-center rounded bg-[#1a1008] border border-[#4a3828] text-xs font-bold hover:text-[#d4943c] cursor-pointer shrink-0"
                            >
                              -
                            </button>
                            <input
                              type="range"
                              min="40"
                              max="420"
                              value={selectedInTimeline.bpmOverride || bpm}
                              onChange={(e) => updateTimelineItemProps(selectedInTimeline.id, { bpmOverride: parseInt(e.target.value) })}
                              className="w-full accent-[#d4943c] cursor-pointer h-1 bg-[#2a1e10] rounded"
                            />
                            <button
                              onClick={() => {
                                const val = selectedInTimeline.bpmOverride || bpm;
                                updateTimelineItemProps(selectedInTimeline.id, { bpmOverride: Math.min(420, val + 1) });
                              }}
                              className="w-5 h-5 flex items-center justify-center rounded bg-[#1a1008] border border-[#4a3828] text-xs font-bold hover:text-[#d4943c] cursor-pointer shrink-0"
                            >
                              +
                            </button>
                            <span className="text-xs font-mono font-bold text-[#d4943c] w-8 text-right shrink-0">
                              {selectedInTimeline.bpmOverride || bpm}
                            </span>
                          </div>
                          <div className="flex gap-1 justify-between">
                            <span className="text-[8px] text-[#7a6a58] font-mono">Langsamer ↔ Schneller</span>
                            {selectedInTimeline.bpmOverride && (
                              <button
                                onClick={() => updateTimelineItemProps(selectedInTimeline.id, { bpmOverride: undefined })}
                                className="text-[8px] text-[#b84a32] hover:underline cursor-pointer"
                              >
                                Reset (Global)
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 2. Volume Dynamics */}
                        <div className="space-y-1 bg-[#120a05] p-2 rounded-lg border border-[#3a2818]/60">
                          <span className="block text-[10px] uppercase tracking-wider text-[#7a6a58] font-mono font-bold">
                            🔊 Lautstärke & Dynamik
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: "Normal (p)", val: "normal" },
                              { label: "Piano (pp)", val: "piano" },
                              { label: "Forte (ff)", val: "forte" },
                              { label: "Crescendo ↗", val: "crescendo" },
                              { label: "Decrescendo ↘", val: "decrescendo" }
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => updateTimelineItemProps(selectedInTimeline.id, { dynamic: opt.val as any })}
                                className={`text-[9px] px-2 py-1 rounded border font-mono font-bold transition-all cursor-pointer ${
                                  (selectedInTimeline.dynamic || "normal") === opt.val
                                    ? "bg-[#d4943c] border-[#d4943c] text-[#120a05]"
                                    : "bg-[#1a1008] border-[#4a3828] text-[#c8b8a4] hover:border-[#7a6a58]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Technique */}
                        <div className="space-y-1 bg-[#120a05] p-2 rounded-lg border border-[#3a2818]/60">
                          <span className="block text-[10px] uppercase tracking-wider text-[#7a6a58] font-mono font-bold">
                            🎸 Band-Muting & Spielweise
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: "Standard Band", val: "normal" },
                              { label: "Hold (Solo Akkord)", val: "hold" },
                              { label: "Mute Break (Stopp)", val: "break" }
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => updateTimelineItemProps(selectedInTimeline.id, { technique: opt.val as any })}
                                className={`text-[9px] px-2 py-1 rounded border font-mono font-bold transition-all cursor-pointer ${
                                  (selectedInTimeline.technique || "normal") === opt.val
                                    ? "bg-[#d4943c] border-[#d4943c] text-[#120a05]"
                                    : "bg-[#1a1008] border-[#4a3828] text-[#c8b8a4] hover:border-[#7a6a58]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 4. Strum Override */}
                        <div className="space-y-1 bg-[#120a05] p-2 rounded-lg border border-[#3a2818]/60">
                          <span className="block text-[10px] uppercase tracking-wider text-[#7a6a58] font-mono font-bold">
                            🎹 Step Zupfmuster (Override)
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: "Standard", val: undefined },
                              { label: "Blocks", val: "block" },
                              { label: "Arp", val: "arpeggio" },
                              { label: "Strum 🎘", val: "strum" }
                            ].map((opt, oi) => (
                              <button
                                key={oi}
                                onClick={() => updateTimelineItemProps(selectedInTimeline.id, { strumOverride: opt.val as any })}
                                className={`text-[9px] px-2 py-1 rounded border font-mono font-bold transition-all cursor-pointer ${
                                  selectedInTimeline.strumOverride === opt.val
                                    ? "bg-[#d4943c] border-[#d4943c] text-[#120a05]"
                                    : "bg-[#1a1008] border-[#4a3828] text-[#c8b8a4] hover:border-[#7a6a58]"
                                }`}
                              >
                                {opt.label || "System"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

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

      {/* WhatsApp Warning Modal (Length / Recordings) */}
      <AnimatePresence>
        {whatsAppWarningModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWhatsAppWarningModalOpen(false)}
            className="fixed inset-0 bg-black/85 z-55 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#2a1e10] border-2 border-[#4a3828] p-6 rounded-2xl max-w-lg w-full text-sm leading-relaxed shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-left"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#4a3828]/40">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <h2 className="text-lg font-serif text-[#d4943c] font-black">
                    Teilen-Hinweis (WhatsApp & Audio)
                  </h2>
                </div>
                <button
                  onClick={() => setWhatsAppWarningModalOpen(false)}
                  className="p-1 text-[#7a6a58] hover:text-[#f0e0cc] transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-[#f0e0cc]">
                {whatsAppWarningReason === "length" && (
                  <div className="space-y-3">
                    <p className="font-bold text-[#e5a952]">Dein Song ist sehr lang!</p>
                    <p className="text-xs text-[#a89880] leading-relaxed">
                      Weil das Arrangement sehr viele Takte/Akkorde enthält, übersteigt der Code das Zeichenlimit für WhatsApp-Links (~2000 Zeichen). Eine automatische Weiterleitung würde vom Browser oder WhatsApp abgeschnitten werden, was zu einem fehlerhaften Import führt.
                    </p>
                    <div className="p-3 bg-[#120a04] border border-[#e5a952]/20 rounded-xl text-xs space-y-2">
                      <p className="font-extrabold text-[#4a9e5c] flex items-center gap-1.5">
                        <span>✅</span> Automatisch kopiert!
                      </p>
                      <p className="text-[#a89880] leading-normal font-mono">
                        Der vollständige unbeschädigte Code wurde bereits in deine <strong>Zwischenablage kopiert</strong>. Du musst ihn nur noch im WhatsApp-Chat an deinen Kumpel einfügen (<strong>Strg+V</strong> bzw. <strong>Gedrückt halten → Einfügen</strong>) und abschicken!
                      </p>
                    </div>
                  </div>
                )}

                {whatsAppWarningReason === "recordings" && (
                  <div className="space-y-3">
                    <p className="font-bold text-[#e5a952]">Aufnahme im Arrangement gefunden!</p>
                    <p className="text-xs text-[#a89880] leading-relaxed">
                      Dein Arrangement enthält Tonaufnahmen (Mikrofon/Gesang/Gitarre). Roh-Audiodateien sind viel zu groß, um in einem Text-Code per WhatsApp übertragen zu werden. Der Code überträgt nur die Takte und Settings, die Soundclips spielen beim Empfänger stumm ab.
                    </p>
                    <div className="p-3 bg-[#120a04] border border-[#e5a952]/20 rounded-xl text-xs space-y-2">
                      <p className="font-extrabold text-[#4a9e5c] flex items-center gap-1.5">
                        <span>🎙️</span> Sound-Export Anleitung:
                      </p>
                      <ol className="list-decimal list-inside text-[#a5957e] space-y-1.5 leading-normal">
                        <li>Füge den kopierten Code im Chat ein, um Rhythmus gänzlich zu übertragen.</li>
                        <li>Gehe in der App in den Tab <strong>&quot;Aufnahme&quot;</strong>.</li>
                        <li>Klicke bei deinen Aufnahmen auf <strong>&quot;Herunterladen&quot;</strong>.</li>
                        <li>Sende diese heruntergeladene Audiodatei zusätzlich über WhatsApp mit!</li>
                      </ol>
                    </div>
                  </div>
                )}

                {whatsAppWarningReason === "both" && (
                  <div className="space-y-3">
                    <p className="font-bold text-[#e5a952]">Sehr langer Song & Aufnahmen vorhanden!</p>
                    <p className="text-xs text-[#a89880] leading-relaxed">
                      Dieses Arrangement ist sehr lang und enthält zudem eigene Tonaufnahmen (Mikrofon/Vocals). WhatsApp-Weiterleitungs-URLs sind dafür zu kurz, und die rohen Audiodateien können nicht im Text eingebettet werden.
                    </p>
                    <div className="p-3 bg-[#120a04] border border-[#e5a952]/20 rounded-xl text-xs space-y-2">
                      <p className="font-bold text-[#4a9e5c] mb-1">Was musst du tun?</p>
                      <ul className="list-disc list-inside text-[#a5957e] space-y-1 text-left leading-normal">
                        <li>Der Code wurde bereits <strong>in deine Zwischenablage kopiert!</strong></li>
                        <li>Füge den Code manuell im Chat ein und sende ihn.</li>
                        <li>Lade deine Aufnahmen im Tab <strong>&quot;Aufnahme&quot;</strong> herunter und sende sie als separate Audiodatei.</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-[#4a3828]/40">
                  <button
                    onClick={() => setWhatsAppWarningModalOpen(false)}
                    className="px-6 py-2 bg-[#d4943c] hover:bg-[#ebd083] text-[#1a1008] font-mono uppercase text-xs font-black rounded-xl border-none cursor-pointer tracking-wider"
                  >
                    Verstanden! 👍
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
