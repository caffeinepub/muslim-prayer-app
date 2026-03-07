import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { type LangCode, tr, useLanguage } from "../hooks/useLanguage";

// ─── Prayer Step Type ───────────────────────────────────────────────────────
interface PrayerStep {
  stepNumber: number;
  name: string;
  arabicDhikr: string;
  transliteration: string;
  description: string;
  poseType:
    | "standing"
    | "hands-folded"
    | "ruku"
    | "standing-after-ruku"
    | "sujud"
    | "sitting"
    | "sitting-tashahhud"
    | "salam-right"
    | "salam-left"
    | "niyyah"
    | "rakaat-label";
  repetitions?: string;
  isRakaatLabel?: boolean;
  rakaatNum?: number;
  imageUrl?: string;
}

// ─── Beautiful SVG Prayer Poses ───────────────────────────────────────────────
function PrayerPoseSVG({ pose }: { pose: PrayerStep["poseType"] }) {
  const base = "w-full h-full";
  const C = "#10b981"; // orange
  const CL = "#10b98115"; // orange very light fill

  if (pose === "rakaat-label") {
    return (
      <svg viewBox="0 0 160 160" className={base} aria-hidden="true">
        <circle cx="80" cy="80" r="64" fill={CL} />
        <circle
          cx="80"
          cy="80"
          r="64"
          fill="none"
          stroke={C}
          strokeWidth="1.5"
          strokeOpacity="0.3"
          strokeDasharray="6 3"
        />
        <text
          x="80"
          y="70"
          textAnchor="middle"
          fontSize="16"
          fill={C}
          fontFamily="serif"
          fontWeight="bold"
        >
          ركعة
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          fontSize="13"
          fill={C}
          fontFamily="sans-serif"
          opacity="0.7"
        >
          ракаат
        </text>
      </svg>
    );
  }

  switch (pose) {
    // ── Niyyah — Standing, hands raised to ears (Takbir) ────────────────────
    case "niyyah":
      return (
        <svg viewBox="0 0 160 220" className={base} aria-hidden="true">
          {/* Background glow */}
          <radialGradient id="glow-niyyah" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={C} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="80" cy="88" rx="60" ry="70" fill="url(#glow-niyyah)" />
          {/* Head */}
          <circle cx="80" cy="30" r="16" fill={CL} stroke={C} strokeWidth="3" />
          {/* Neck */}
          <line
            x1="80"
            y1="46"
            x2="80"
            y2="58"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Shoulders */}
          <line
            x1="55"
            y1="68"
            x2="105"
            y2="68"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Torso */}
          <line
            x1="80"
            y1="58"
            x2="80"
            y2="125"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Left arm raised to ear — elbow up, forearm vertical */}
          <line
            x1="55"
            y1="68"
            x2="38"
            y2="48"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="38"
            y1="48"
            x2="38"
            y2="28"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right arm raised to ear */}
          <line
            x1="105"
            y1="68"
            x2="122"
            y2="48"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="122"
            y1="48"
            x2="122"
            y2="28"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Palm left */}
          <rect
            x="32"
            y="20"
            width="12"
            height="9"
            rx="2"
            fill={CL}
            stroke={C}
            strokeWidth="2"
          />
          {/* Palm right */}
          <rect
            x="116"
            y="20"
            width="12"
            height="9"
            rx="2"
            fill={CL}
            stroke={C}
            strokeWidth="2"
          />
          {/* Hips */}
          <line
            x1="80"
            y1="125"
            x2="65"
            y2="125"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="80"
            y1="125"
            x2="95"
            y2="125"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Left leg */}
          <line
            x1="65"
            y1="125"
            x2="62"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Right leg */}
          <line
            x1="95"
            y1="125"
            x2="98"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Feet */}
          <line
            x1="62"
            y1="185"
            x2="47"
            y2="190"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="98"
            y1="185"
            x2="113"
            y2="190"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Ground */}
          <line
            x1="20"
            y1="196"
            x2="140"
            y2="196"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        </svg>
      );

    // ── Standing with folded hands on chest (Qiyam / Sana) ──────────────────
    case "standing":
    case "hands-folded":
      return (
        <svg viewBox="0 0 160 220" className={base} aria-hidden="true">
          <radialGradient id="glow-stand" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={C} stopOpacity="0.10" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="80" cy="88" rx="60" ry="70" fill="url(#glow-stand)" />
          {/* Head */}
          <circle cx="80" cy="30" r="16" fill={CL} stroke={C} strokeWidth="3" />
          {/* Neck */}
          <line
            x1="80"
            y1="46"
            x2="80"
            y2="58"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Shoulders */}
          <line
            x1="50"
            y1="68"
            x2="110"
            y2="68"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Torso */}
          <line
            x1="80"
            y1="58"
            x2="80"
            y2="125"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Right arm — down and across chest (right hand on top) */}
          <line
            x1="110"
            y1="68"
            x2="108"
            y2="88"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="108"
            y1="88"
            x2="72"
            y2="93"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Left arm — under right, forearm across */}
          <line
            x1="50"
            y1="68"
            x2="52"
            y2="90"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="52"
            y1="90"
            x2="92"
            y2="96"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Cross indicator */}
          <circle cx="80" cy="91" r="5" fill={C} fillOpacity="0.25" />
          {/* Hips */}
          <line
            x1="80"
            y1="125"
            x2="65"
            y2="125"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="80"
            y1="125"
            x2="95"
            y2="125"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Legs */}
          <line
            x1="65"
            y1="125"
            x2="62"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="95"
            y1="125"
            x2="98"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Feet */}
          <line
            x1="62"
            y1="185"
            x2="47"
            y2="190"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="98"
            y1="185"
            x2="113"
            y2="190"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Ground */}
          <line
            x1="20"
            y1="196"
            x2="140"
            y2="196"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        </svg>
      );

    // ── Ruku — 90° bow, back flat, hands on knees, head level ───────────────
    case "ruku":
      return (
        <svg viewBox="0 0 220 180" className={base} aria-hidden="true">
          <radialGradient id="glow-ruku" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C} stopOpacity="0.10" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="110" cy="90" rx="90" ry="60" fill="url(#glow-ruku)" />
          {/* Ground line */}
          <line
            x1="10"
            y1="162"
            x2="210"
            y2="162"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          {/* Left leg — vertical */}
          <line
            x1="130"
            y1="162"
            x2="130"
            y2="100"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Right leg — vertical (offset) */}
          <line
            x1="148"
            y1="162"
            x2="148"
            y2="100"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Feet */}
          <line
            x1="130"
            y1="162"
            x2="115"
            y2="166"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="148"
            y1="162"
            x2="163"
            y2="166"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Hip joint */}
          <circle cx="140" cy="100" r="5" fill={C} fillOpacity="0.3" />
          {/* Back — HORIZONTAL at 90 degrees, extending left from hips */}
          <line
            x1="140"
            y1="100"
            x2="40"
            y2="100"
            stroke={C}
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Right angle marker at hip */}
          <path
            d="M140 112 L128 112 L128 100"
            fill="none"
            stroke={C}
            strokeWidth="1.8"
            strokeOpacity="0.5"
          />
          {/* Neck extending left from shoulders */}
          <line
            x1="40"
            y1="100"
            x2="30"
            y2="100"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Head — at far left, level with back */}
          <circle
            cx="18"
            cy="100"
            r="14"
            fill={CL}
            stroke={C}
            strokeWidth="3"
          />
          {/* Left arm — down from left shoulder area, hand on left knee */}
          <line
            x1="55"
            y1="100"
            x2="55"
            y2="130"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="55"
            y1="130"
            x2="130"
            y2="105"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          {/* Right arm — down from right shoulder area, hand on right knee */}
          <line
            x1="75"
            y1="100"
            x2="75"
            y2="130"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="75"
            y1="130"
            x2="148"
            y2="105"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
          {/* Knee caps */}
          <circle cx="130" cy="105" r="4" fill={C} fillOpacity="0.4" />
          <circle cx="148" cy="105" r="4" fill={C} fillOpacity="0.3" />
        </svg>
      );

    // ── I'tidal — Standing upright after ruku, arms at sides ────────────────
    case "standing-after-ruku":
      return (
        <svg viewBox="0 0 160 220" className={base} aria-hidden="true">
          <radialGradient id="glow-itidal" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={C} stopOpacity="0.10" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="80" cy="90" rx="60" ry="70" fill="url(#glow-itidal)" />
          {/* Head */}
          <circle cx="80" cy="30" r="16" fill={CL} stroke={C} strokeWidth="3" />
          {/* Neck */}
          <line
            x1="80"
            y1="46"
            x2="80"
            y2="58"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Shoulders */}
          <line
            x1="50"
            y1="68"
            x2="110"
            y2="68"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Torso */}
          <line
            x1="80"
            y1="58"
            x2="80"
            y2="125"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Arms hanging at sides — slightly open palms */}
          <line
            x1="50"
            y1="68"
            x2="44"
            y2="118"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="110"
            y1="68"
            x2="116"
            y2="118"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Open palms (flat facing forward) */}
          <rect
            x="37"
            y="118"
            width="10"
            height="8"
            rx="2"
            fill={CL}
            stroke={C}
            strokeWidth="2"
          />
          <rect
            x="113"
            y="118"
            width="10"
            height="8"
            rx="2"
            fill={CL}
            stroke={C}
            strokeWidth="2"
          />
          {/* Hips */}
          <line
            x1="80"
            y1="125"
            x2="65"
            y2="125"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="80"
            y1="125"
            x2="95"
            y2="125"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Legs */}
          <line
            x1="65"
            y1="125"
            x2="62"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="95"
            y1="125"
            x2="98"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Feet */}
          <line
            x1="62"
            y1="185"
            x2="47"
            y2="190"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="98"
            y1="185"
            x2="113"
            y2="190"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Ground */}
          <line
            x1="20"
            y1="196"
            x2="140"
            y2="196"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        </svg>
      );

    // ── Sujud — Side profile view: forehead on ground, hips highest ──────────
    case "sujud":
      return (
        <svg viewBox="0 0 280 160" className={base} aria-hidden="true">
          <radialGradient id="glow-sujud" cx="50%" cy="80%" r="55%">
            <stop offset="0%" stopColor={C} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="140" cy="135" rx="120" ry="22" fill="url(#glow-sujud)" />

          {/* Ground line */}
          <line
            x1="8"
            y1="140"
            x2="272"
            y2="140"
            stroke={C}
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />

          {/* ── FEET/TOES — right side, toes curled down touching ground ── */}
          {/* Toes: vertical small line touching ground */}
          <line
            x1="245"
            y1="125"
            x2="245"
            y2="140"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="238"
            y1="126"
            x2="238"
            y2="140"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />

          {/* ── LOWER LEG (shin) — diagonal up-left from toes ── */}
          <line
            x1="243"
            y1="130"
            x2="210"
            y2="100"
            stroke={C}
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* ── KNEE joint ── */}
          <circle
            cx="210"
            cy="100"
            r="5"
            fill={C}
            fillOpacity="0.35"
            stroke={C}
            strokeWidth="1.5"
          />

          {/* ── THIGH — steeply up-left from knee to raised hips ── */}
          <line
            x1="210"
            y1="100"
            x2="168"
            y2="52"
            stroke={C}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* ── HIPS — the HIGHEST point, prominent circle ── */}
          <circle
            cx="168"
            cy="50"
            r="9"
            fill={C}
            fillOpacity="0.30"
            stroke={C}
            strokeWidth="2.5"
          />

          {/* ── BACK — slopes DOWN from hips forward-left toward shoulders ── */}
          <line
            x1="168"
            y1="52"
            x2="88"
            y2="92"
            stroke={C}
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* ── SHOULDERS/CHEST area ── */}
          <circle cx="88" cy="93" r="5" fill={C} fillOpacity="0.2" />

          {/* ── NECK — from shoulders down-forward to head on ground ── */}
          <line
            x1="88"
            y1="93"
            x2="56"
            y2="124"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* ── HEAD — left side, forehead touching the ground ── */}
          <circle
            cx="44"
            cy="126"
            r="14"
            fill={CL}
            stroke={C}
            strokeWidth="3"
          />

          {/* ── FOREHEAD DOT on ground (the sajda point) ── */}
          <circle cx="44" cy="140" r="6" fill={C} fillOpacity="0.95" />
          {/* Small indicator line forehead → ground */}
          <line
            x1="44"
            y1="130"
            x2="44"
            y2="140"
            stroke={C}
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />

          {/* ── ARMS — both flat on ground, one each side of head (visible from side) ── */}
          {/* Front arm (near side) */}
          <line
            x1="82"
            y1="97"
            x2="22"
            y2="135"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cx="17"
            cy="138"
            rx="9"
            ry="4"
            fill={CL}
            stroke={C}
            strokeWidth="2"
          />
          {/* Back arm (slightly offset/behind, thinner) */}
          <line
            x1="90"
            y1="96"
            x2="62"
            y2="136"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          <ellipse
            cx="67"
            cy="139"
            rx="7"
            ry="3"
            fill={CL}
            stroke={C}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Label: "7 точек" annotation */}
          <circle
            cx="44"
            cy="140"
            r="10"
            fill="none"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="3 2"
          />
          <text
            x="220"
            y="130"
            fontSize="9"
            fill={C}
            fontFamily="sans-serif"
            fillOpacity="0.6"
            textAnchor="middle"
          >
            7 точек
          </text>
        </svg>
      );

    // ── Sitting (Jalsa) — side profile: sitting on left leg, right leg bent ──
    case "sitting":
      return (
        <svg viewBox="0 0 240 200" className={base} aria-hidden="true">
          <radialGradient id="glow-jalsa" cx="45%" cy="75%" r="55%">
            <stop offset="0%" stopColor={C} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="110" cy="168" rx="95" ry="20" fill="url(#glow-jalsa)" />

          {/* Ground line */}
          <line
            x1="10"
            y1="170"
            x2="230"
            y2="170"
            stroke={C}
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />

          {/* ── SITTING SHADOW under body ── */}
          <ellipse
            cx="108"
            cy="170"
            rx="38"
            ry="7"
            fill={C}
            fillOpacity="0.07"
          />

          {/* ── LEFT FOOT (tucked under, from side) — visible along the ground ──
              In iftirash, left foot is tucked under, lying on its side, sole facing right */}
          <line
            x1="58"
            y1="165"
            x2="96"
            y2="165"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* ankle bump */}
          <circle cx="96" cy="163" r="3.5" fill={C} fillOpacity="0.3" />
          {/* Left shin going back-up to the left (tucked) */}
          <line
            x1="96"
            y1="162"
            x2="82"
            y2="128"
            stroke={C}
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* ── LEFT THIGH — near-horizontal going right toward hips ── */}
          <line
            x1="82"
            y1="128"
            x2="108"
            y2="118"
            stroke={C}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* ── HIP JOINT ── */}
          <circle
            cx="108"
            cy="117"
            r="6"
            fill={C}
            fillOpacity="0.25"
            stroke={C}
            strokeWidth="2"
          />

          {/* ── RIGHT THIGH — goes forward-right and slightly downward ── */}
          <line
            x1="108"
            y1="118"
            x2="158"
            y2="130"
            stroke={C}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* ── RIGHT KNEE ── */}
          <circle
            cx="158"
            cy="131"
            r="5"
            fill={C}
            fillOpacity="0.25"
            stroke={C}
            strokeWidth="1.5"
          />

          {/* ── RIGHT SHIN — goes down from knee to foot on ground ── */}
          <line
            x1="158"
            y1="132"
            x2="162"
            y2="168"
            stroke={C}
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* ── RIGHT FOOT — on the ground, pointing forward-right ── */}
          <line
            x1="155"
            y1="169"
            x2="190"
            y2="170"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* ── TORSO — upright from hips to shoulders ── */}
          <line
            x1="106"
            y1="117"
            x2="100"
            y2="52"
            stroke={C}
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* ── SHOULDERS ── */}
          <line
            x1="82"
            y1="60"
            x2="118"
            y2="58"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* ── NECK ── */}
          <line
            x1="100"
            y1="52"
            x2="100"
            y2="44"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* ── HEAD ── upright, looking forward */}
          <circle
            cx="100"
            cy="32"
            r="14"
            fill={CL}
            stroke={C}
            strokeWidth="3"
          />

          {/* ── FRONT ARM (visible side) — resting on right knee ── */}
          {/* Upper arm down from right shoulder */}
          <line
            x1="118"
            y1="59"
            x2="136"
            y2="92"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Forearm going toward knee */}
          <line
            x1="136"
            y1="92"
            x2="155"
            y2="120"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Hand resting on knee */}
          <ellipse
            cx="158"
            cy="123"
            rx="7"
            ry="4"
            fill={CL}
            stroke={C}
            strokeWidth="2"
          />

          {/* ── BACK ARM (far side, slightly offset) — resting on left thigh ── */}
          <line
            x1="84"
            y1="61"
            x2="76"
            y2="90"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
          <line
            x1="76"
            y1="90"
            x2="84"
            y2="118"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          <ellipse
            cx="86"
            cy="120"
            rx="6"
            ry="3.5"
            fill={CL}
            stroke={C}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        </svg>
      );

    // ── Tashahhud — Sitting, right index finger raised (Shahada gesture) ─────
    case "sitting-tashahhud":
      return (
        <svg viewBox="0 0 180 200" className={base} aria-hidden="true">
          <radialGradient id="glow-tash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C} stopOpacity="0.10" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="90" cy="110" rx="70" ry="55" fill="url(#glow-tash)" />
          {/* Ground line */}
          <line
            x1="15"
            y1="168"
            x2="165"
            y2="168"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          {/* Head */}
          <circle cx="90" cy="28" r="16" fill={CL} stroke={C} strokeWidth="3" />
          {/* Neck */}
          <line
            x1="90"
            y1="44"
            x2="90"
            y2="56"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Shoulders */}
          <line
            x1="62"
            y1="66"
            x2="118"
            y2="66"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Torso — upright */}
          <line
            x1="90"
            y1="56"
            x2="90"
            y2="110"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* LEFT arm — forearm raised, INDEX FINGER POINTING UP */}
          <line
            x1="62"
            y1="66"
            x2="52"
            y2="90"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="52"
            y1="90"
            x2="46"
            y2="72"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* INDEX FINGER — prominent, pointing straight up */}
          <line
            x1="46"
            y1="72"
            x2="46"
            y2="52"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Finger tip glow */}
          <circle cx="46" cy="50" r="5" fill={C} fillOpacity="0.9" />
          <circle cx="46" cy="50" r="9" fill={C} fillOpacity="0.2" />
          {/* RIGHT arm — resting on right thigh, hand open */}
          <line
            x1="118"
            y1="66"
            x2="125"
            y2="100"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="125"
            y1="100"
            x2="125"
            y2="115"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Thighs */}
          <line
            x1="90"
            y1="110"
            x2="40"
            y2="120"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="90"
            y1="110"
            x2="140"
            y2="120"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Lower legs */}
          <line
            x1="40"
            y1="120"
            x2="30"
            y2="155"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="140"
            y1="120"
            x2="150"
            y2="155"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Feet */}
          <line
            x1="30"
            y1="155"
            x2="18"
            y2="158"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="30"
            y1="155"
            x2="50"
            y2="160"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <line
            x1="150"
            y1="155"
            x2="162"
            y2="158"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Sitting surface */}
          <ellipse
            cx="90"
            cy="158"
            rx="20"
            ry="5"
            fill={C}
            fillOpacity="0.08"
          />
        </svg>
      );

    // ── Salam Right — Sitting, head clearly turned RIGHT with arrow ──────────
    case "salam-right":
      return (
        <svg viewBox="0 0 200 200" className={base} aria-hidden="true">
          <radialGradient id="glow-sr" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C} stopOpacity="0.10" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="100" cy="110" rx="80" ry="55" fill="url(#glow-sr)" />
          {/* Ground line */}
          <line
            x1="15"
            y1="168"
            x2="185"
            y2="168"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          {/* Head — offset RIGHT to show turning */}
          <circle
            cx="112"
            cy="30"
            r="16"
            fill={CL}
            stroke={C}
            strokeWidth="3"
          />
          {/* Direction ARROW — curved arc pointing right */}
          <path
            d="M125 22 Q148 14 155 28"
            fill="none"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <polygon points="155,28 148,22 160,22" fill={C} />
          {/* "вправо" label */}
          <text
            x="154"
            y="42"
            textAnchor="middle"
            fontSize="9"
            fill={C}
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            →
          </text>
          {/* Neck — connects head (turned right) to body center */}
          <line
            x1="105"
            y1="46"
            x2="98"
            y2="58"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Shoulders — body straight */}
          <line
            x1="70"
            y1="68"
            x2="126"
            y2="68"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Torso */}
          <line
            x1="98"
            y1="58"
            x2="98"
            y2="112"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Arms resting on thighs */}
          <line
            x1="70"
            y1="68"
            x2="62"
            y2="100"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="62"
            y1="100"
            x2="62"
            y2="114"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="126"
            y1="68"
            x2="134"
            y2="100"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="134"
            y1="100"
            x2="134"
            y2="114"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Thighs */}
          <line
            x1="98"
            y1="112"
            x2="48"
            y2="122"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="98"
            y1="112"
            x2="148"
            y2="122"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Lower legs */}
          <line
            x1="48"
            y1="122"
            x2="38"
            y2="157"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="148"
            y1="122"
            x2="158"
            y2="157"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Feet */}
          <line
            x1="38"
            y1="157"
            x2="25"
            y2="160"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="158"
            y1="157"
            x2="170"
            y2="160"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cx="98"
            cy="160"
            rx="22"
            ry="5"
            fill={C}
            fillOpacity="0.08"
          />
        </svg>
      );

    // ── Salam Left — Sitting, head clearly turned LEFT with arrow ───────────
    case "salam-left":
      return (
        <svg viewBox="0 0 200 200" className={base} aria-hidden="true">
          <radialGradient id="glow-sl" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C} stopOpacity="0.10" />
            <stop offset="100%" stopColor={C} stopOpacity="0" />
          </radialGradient>
          <ellipse cx="100" cy="110" rx="80" ry="55" fill="url(#glow-sl)" />
          {/* Ground line */}
          <line
            x1="15"
            y1="168"
            x2="185"
            y2="168"
            stroke={C}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          {/* Head — offset LEFT to show turning */}
          <circle cx="88" cy="30" r="16" fill={CL} stroke={C} strokeWidth="3" />
          {/* Direction ARROW — curved arc pointing left */}
          <path
            d="M75 22 Q52 14 45 28"
            fill="none"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <polygon points="45,28 52,22 40,22" fill={C} />
          {/* "влево" label */}
          <text
            x="44"
            y="42"
            textAnchor="middle"
            fontSize="9"
            fill={C}
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            ←
          </text>
          {/* Neck */}
          <line
            x1="95"
            y1="46"
            x2="102"
            y2="58"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Shoulders */}
          <line
            x1="74"
            y1="68"
            x2="130"
            y2="68"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Torso */}
          <line
            x1="102"
            y1="58"
            x2="102"
            y2="112"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Arms resting */}
          <line
            x1="74"
            y1="68"
            x2="66"
            y2="100"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="66"
            y1="100"
            x2="66"
            y2="114"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="130"
            y1="68"
            x2="138"
            y2="100"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="138"
            y1="100"
            x2="138"
            y2="114"
            stroke={C}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Thighs */}
          <line
            x1="102"
            y1="112"
            x2="52"
            y2="122"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="102"
            y1="112"
            x2="152"
            y2="122"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Lower legs */}
          <line
            x1="52"
            y1="122"
            x2="42"
            y2="157"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="152"
            y1="122"
            x2="162"
            y2="157"
            stroke={C}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Feet */}
          <line
            x1="42"
            y1="157"
            x2="29"
            y2="160"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="162"
            y1="157"
            x2="174"
            y2="160"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cx="102"
            cy="160"
            rx="22"
            ry="5"
            fill={C}
            fillOpacity="0.08"
          />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 160 220" className={base} aria-hidden="true">
          <circle cx="80" cy="30" r="16" fill={CL} stroke={C} strokeWidth="3" />
          <line
            x1="80"
            y1="46"
            x2="80"
            y2="125"
            stroke={C}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="80"
            y1="125"
            x2="65"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="80"
            y1="125"
            x2="95"
            y2="185"
            stroke={C}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

// ─── Base rakaat sequence (full) ─────────────────────────────────────────────
function buildRakaat(
  startNum: number,
  rakaatNum: number,
  isFirst: boolean,
  _isLast: boolean,
  totalRakaat: number,
  addTashahhud: "short" | "full" | "none",
  addSalam: boolean,
): PrayerStep[] {
  const steps: PrayerStep[] = [];
  let n = startNum;

  // Ракаат заголовок
  steps.push({
    stepNumber: n++,
    name: `${rakaatNum}-й ракаат`,
    arabicDhikr: "",
    transliteration: "",
    description: `Начало ${rakaatNum}-го ракаата из ${totalRakaat}.`,
    poseType: "rakaat-label",
    isRakaatLabel: true,
    rakaatNum,
  });

  if (isFirst) {
    // Ният
    steps.push({
      stepNumber: n++,
      name: "Ният (Намерение)",
      arabicDhikr: "اللَّهُ أَكْبَرُ",
      transliteration: "Аллаху Акбар",
      description:
        "Встаньте прямо лицом к Кибле. Сделайте намерение в сердце. Поднимите руки до уровня ушей и произнесите такбир.",
      poseType: "niyyah",
    });

    // Сана
    steps.push({
      stepNumber: n++,
      name: "Сана (Открывающая дуа)",
      arabicDhikr: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ",
      transliteration:
        "Субханакаллахумма ва бихамдика ва табаракасмука ва та'аля джаддука ва ля иляха гайрук",
      description:
        "Сложите руки на груди (правая поверх левой). Читайте открывающую дуа — Сана. Затем А'узу и Басмалу.",
      poseType: "hands-folded",
    });
  }

  // Аль-Фатиха
  steps.push({
    stepNumber: n++,
    name: isFirst ? "Аль-Фатиха + Сура" : "Аль-Фатиха",
    arabicDhikr: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    transliteration: isFirst
      ? "Читайте Аль-Фатиху, затем любую суру (например, Аль-Ихлас)"
      : "В 3-м и 4-м ракаатах — только Аль-Фатиха, без дополнительной суры",
    description: isFirst
      ? "Читайте Суру Аль-Фатиха (обязательно), затем любую другую суру Корана. Например: Аль-Ихлас (112), Аль-Фаляк (113) или Ан-Нас (114)."
      : "В 3-м и 4-м ракаатах достаточно прочитать только Аль-Фатиху. Дополнительная сура не читается (кроме сунны).",
    poseType: "hands-folded",
  });

  // Руку
  steps.push({
    stepNumber: n++,
    name: "Руку (Поясной поклон)",
    arabicDhikr: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    transliteration: "Субхана Раббияль Азым",
    description:
      "Произнесите «Аллаху Акбар» и наклонитесь: спина параллельна полу, руки на коленях, голова ровно. Произносите зикр 3 раза.",
    poseType: "ruku",
    repetitions: "× 3",
  });

  // И'тидаль
  steps.push({
    stepNumber: n++,
    name: "И'тидаль (Выпрямление)",
    arabicDhikr: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ ۝ رَبَّنَا لَكَ الْحَمْدُ",
    transliteration: "Сами'аллаху лиман хамидах. Раббана лякаль хамд.",
    description:
      "Выпрямитесь полностью, произнесите тасмиа поднимаясь, затем хамд стоя прямо. Руки опускаются вдоль тела.",
    poseType: "standing-after-ruku",
  });

  // Первый саджд
  steps.push({
    stepNumber: n++,
    name: "Саджда (Земной поклон)",
    arabicDhikr: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    transliteration: "Субхана Раббияль А'ля",
    description:
      "Произнесите «Аллаху Акбар» и опуститесь на 7 частей тела: лоб+нос, обе ладони, оба колена, кончики обоих стоп. Произносите зикр 3 раза.",
    poseType: "sujud",
    repetitions: "× 3",
    imageUrl:
      "https://s10.iimage.su/s/06/gSzp5AsxwuvUnraBzk9SBIHgav4qtAMgNWu8es6h2.png",
  });

  // Сидение между саджда
  steps.push({
    stepNumber: n++,
    name: "Сидение между саджда",
    arabicDhikr: "رَبِّ اغْفِرْ لِي",
    transliteration: "Раббигфирли, Раббигфирли",
    description:
      "Сядьте на левую ногу (ифтираш). Произносите дуа о прощении. Можно добавить: «Аллахумма-гфирли ва-рхамни».",
    poseType: "sitting",
    imageUrl:
      "https://s10.iimage.su/s/06/gT7yNM5xp1gLEIJ3RzqMWqZLhXtJVcfzpglDAOZJF.png",
  });

  // Второй саджд
  steps.push({
    stepNumber: n++,
    name: "Второй Саджда",
    arabicDhikr: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    transliteration: "Субхана Раббияль А'ля",
    description:
      "Снова опуститесь в земной поклон. После него ракаат считается завершённым. Поднимитесь для следующего ракаата или ташаххуда.",
    poseType: "sujud",
    repetitions: "× 3",
    imageUrl:
      "https://s10.iimage.su/s/06/gSzp5AsxwuvUnraBzk9SBIHgav4qtAMgNWu8es6h2.png",
  });

  // Ташаххуд (краткий или полный)
  if (addTashahhud === "short") {
    steps.push({
      stepNumber: n++,
      name: "Ташаххуд (краткий)",
      arabicDhikr: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ",
      transliteration:
        "Ат-тахийяту лилляхи вас-салявату ват-таййибату — ас-саляму 'аляйка аййухан-набийю...",
      description:
        "После 2-го ракаата сядьте. Читайте краткий ташаххуд. После него поднимайтесь для 3-го ракаата, произнося «Аллаху Акбар».",
      poseType: "sitting-tashahhud",
    });
  } else if (addTashahhud === "full") {
    steps.push({
      stepNumber: n++,
      name: "Финальный Ташаххуд",
      arabicDhikr: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ",
      transliteration:
        "Ат-тахийяту лилляхи вас-салявату ват-таййибату — ас-саляму 'аляйка аййухан-набийю...",
      description:
        "Сядьте. Читайте полный ташаххуд + Дуа Ибрахима (Аллахумма салли 'аля Мухаммад...) + дуа о защите от 4 испытаний.",
      poseType: "sitting-tashahhud",
    });
  }

  // Салям
  if (addSalam) {
    steps.push({
      stepNumber: n++,
      name: "Салям — вправо",
      arabicDhikr: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
      transliteration: "Ас-Саляму Алейкум ва Рахматуллах",
      description:
        "Повернуть голову сначала вправо, произнося приветствие ангелу и молящимся справа.",
      poseType: "salam-right",
    });
    steps.push({
      stepNumber: n++,
      name: "Салям — влево",
      arabicDhikr: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
      transliteration: "Ас-Саляму Алейкум ва Рахматуллах",
      description:
        "Затем повернуть голову влево. Намаз завершён. АльхамдулиЛлах! Прочитайте дуа после намаза.",
      poseType: "salam-left",
    });
  }

  return steps;
}

// ─── Build full prayer steps ─────────────────────────────────────────────────
function buildFajrSteps(): PrayerStep[] {
  // 2 фарда + 2 сунны
  const steps: PrayerStep[] = [];
  let n = 1;

  // 1-й ракаат (с ниятом и саной)
  const r1 = buildRakaat(n, 1, true, false, 2, "none", false);
  n += r1.length;
  steps.push(...r1);

  // 2-й ракаат (без нията)
  const r2 = buildRakaat(n, 2, false, true, 2, "full", true);
  steps.push(...r2);

  return steps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
}

function buildDhuhrSteps(): PrayerStep[] {
  const steps: PrayerStep[] = [];
  let n = 1;

  const r1 = buildRakaat(n, 1, true, false, 4, "none", false);
  n += r1.length;
  steps.push(...r1);

  const r2 = buildRakaat(n, 2, false, false, 4, "short", false);
  n += r2.length;
  steps.push(...r2);

  const r3 = buildRakaat(n, 3, false, false, 4, "none", false);
  n += r3.length;
  steps.push(...r3);

  const r4 = buildRakaat(n, 4, false, true, 4, "full", true);
  steps.push(...r4);

  return steps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
}

function buildMaghribSteps(): PrayerStep[] {
  const steps: PrayerStep[] = [];
  let n = 1;

  const r1 = buildRakaat(n, 1, true, false, 3, "none", false);
  n += r1.length;
  steps.push(...r1);

  const r2 = buildRakaat(n, 2, false, false, 3, "short", false);
  n += r2.length;
  steps.push(...r2);

  const r3 = buildRakaat(n, 3, false, true, 3, "full", true);
  steps.push(...r3);

  return steps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
}

function buildIshaSteps(): PrayerStep[] {
  return buildDhuhrSteps(); // Same structure as Dhuhr/Asr
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type GuideTab = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

interface GuideTabDef {
  id: GuideTab;
  labelKey: string;
  subKey: string;
  rakaat: string;
  color: string;
  steps: PrayerStep[];
}

const guideTabs: GuideTabDef[] = [
  {
    id: "fajr",
    labelKey: "prayer.fajr",
    subKey: "guide.2rakaat",
    rakaat: "2 ракаата",
    color: "#6366f1",
    steps: buildFajrSteps(),
  },
  {
    id: "dhuhr",
    labelKey: "prayer.dhuhr",
    subKey: "guide.4rakaat",
    rakaat: "4 ракаата",
    color: "#10b981",
    steps: buildDhuhrSteps(),
  },
  {
    id: "asr",
    labelKey: "prayer.asr",
    subKey: "guide.4rakaat",
    rakaat: "4 ракаата",
    color: "#eab308",
    steps: buildDhuhrSteps(), // same structure
  },
  {
    id: "maghrib",
    labelKey: "prayer.maghrib",
    subKey: "guide.3rakaat",
    rakaat: "3 ракаата",
    color: "#ef4444",
    steps: buildMaghribSteps(),
  },
  {
    id: "isha",
    labelKey: "prayer.isha",
    subKey: "guide.4rakaat",
    rakaat: "4 ракаата",
    color: "#8b5cf6",
    steps: buildIshaSteps(),
  },
];

// ─── Step slide ───────────────────────────────────────────────────────────────
function StepSlide({
  step,
  total,
  direction,
  accentColor,
}: {
  step: PrayerStep;
  total: number;
  direction: number;
  accentColor: string;
}) {
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  // Ракаат разделитель
  if (step.isRakaatLabel) {
    return (
      <motion.div
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="flex flex-col items-center justify-center gap-5 px-5 py-8 min-h-[340px]"
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: `${accentColor}18`,
            border: `2px solid ${accentColor}40`,
          }}
        >
          <span
            className="text-5xl font-display font-bold"
            style={{ color: accentColor }}
          >
            {step.rakaatNum}
          </span>
        </div>
        <div className="text-center space-y-2">
          <div
            className="text-2xl font-display font-bold"
            style={{ color: accentColor }}
          >
            {step.rakaatNum}-й ракаат
          </div>
          <div className="text-sm text-foreground/40 leading-relaxed max-w-[240px]">
            {step.description}
          </div>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{
            background: `${accentColor}15`,
            color: accentColor,
            border: `1px solid ${accentColor}30`,
          }}
        >
          Шаг {step.stepNumber} / {total}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className="flex flex-col items-center gap-4 px-5 py-4"
    >
      {/* Step counter */}
      <div className="flex items-center gap-2 self-stretch">
        <span className="text-xs text-foreground/30 font-medium">
          {step.stepNumber} / {total}
        </span>
        <div className="h-px flex-1 bg-islamic-500/15" />
      </div>

      {/* Illustration */}
      <div
        className="relative rounded-3xl overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{
          width: "220px",
          height: step.imageUrl ? "260px" : "190px",
          background: step.imageUrl
            ? "transparent"
            : `radial-gradient(ellipse 80% 80% at 50% 50%, ${accentColor}20 0%, transparent 70%)`,
          border: `1px solid ${accentColor}20`,
        }}
      >
        {step.imageUrl ? (
          <img
            src={step.imageUrl}
            alt={step.name}
            className="w-full h-full object-contain rounded-3xl"
            style={{ background: "oklch(0.12 0.005 60)" }}
          />
        ) : (
          <div className="w-40 h-40">
            <PrayerPoseSVG pose={step.poseType} />
          </div>
        )}
        {step.repetitions && (
          <div
            className="absolute bottom-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: `${accentColor}25`,
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          >
            {step.repetitions}
          </div>
        )}
      </div>

      {/* Step name */}
      <div className="text-sm font-bold text-foreground/90 font-display text-center">
        {step.name}
      </div>

      {/* Arabic dhikr */}
      {step.arabicDhikr && (
        <div
          className="text-center leading-relaxed px-3"
          style={{
            fontFamily: "serif",
            direction: "rtl",
            fontSize: "1.25rem",
            color: accentColor,
            textShadow: `0 0 20px ${accentColor}50`,
            lineHeight: "1.9",
          }}
        >
          {step.arabicDhikr}
        </div>
      )}

      {/* Transliteration */}
      {step.transliteration && (
        <div
          className="text-center text-xs italic px-4 leading-relaxed"
          style={{ color: `${accentColor}80` }}
        >
          {step.transliteration}
        </div>
      )}

      {/* Description */}
      <div
        className="text-center text-xs text-foreground/55 leading-relaxed rounded-xl py-3 px-4 self-stretch"
        style={{
          background: "oklch(0.16 0.005 60 / 0.5)",
          border: "1px solid oklch(0.55 0.18 45 / 0.08)",
        }}
      >
        {step.description}
      </div>
    </motion.div>
  );
}

// ─── Main PrayerGuide component ───────────────────────────────────────────────
export default function PrayerGuide({ onBack }: { onBack: () => void }) {
  const lang = useLanguage();
  const [activeTab, setActiveTab] = useState<GuideTab>("fajr");
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const currentGuide = guideTabs.find((t) => t.id === activeTab)!;
  const steps = currentGuide.steps;
  const step = steps[stepIdx];

  const goNext = () => {
    if (stepIdx < steps.length - 1) {
      setDirection(1);
      setStepIdx(stepIdx + 1);
    }
  };

  const goPrev = () => {
    if (stepIdx > 0) {
      setDirection(-1);
      setStepIdx(stepIdx - 1);
    }
  };

  const handleTabChange = (tab: GuideTab) => {
    setActiveTab(tab);
    setStepIdx(0);
    setDirection(1);
  };

  const progressPct = ((stepIdx + 1) / steps.length) * 100;

  const tabLabels: Record<GuideTab, string> = {
    fajr: tr("prayer.fajr", lang),
    dhuhr: tr("prayer.dhuhr", lang),
    asr: tr("prayer.asr", lang),
    maghrib: tr("prayer.maghrib", lang),
    isha: tr("prayer.isha", lang),
  };

  const tabRakaat: Record<GuideTab, string> = {
    fajr: "2 рак.",
    dhuhr: "4 рак.",
    asr: "4 рак.",
    maghrib: "3 рак.",
    isha: "4 рак.",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "oklch(0.08 0.005 60)",
        maxWidth: "448px",
        margin: "0 auto",
      }}
      data-ocid="prayer_guide.panel"
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: "1px solid oklch(0.55 0.18 45 / 0.12)",
          background: "oklch(0.1 0.005 60 / 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          onClick={onBack}
          data-ocid="prayer_guide.back_button"
        >
          <ArrowLeft size={18} className="text-islamic-400" />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-gradient-orange font-display">
            {tr("guide.title", lang)}
          </div>
          <div className="text-[10px] text-foreground/30">
            {currentGuide.rakaat}
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* Tab selector */}
      <div
        className="flex-shrink-0 flex px-2 py-2 gap-1 overflow-x-auto scrollbar-hide"
        style={{ borderBottom: "1px solid oklch(0.55 0.18 45 / 0.08)" }}
      >
        {guideTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className="flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl text-center transition-all duration-200 focus-visible:outline-none min-w-[58px]"
            style={
              activeTab === tab.id
                ? {
                    background: `${tab.color}20`,
                    border: `1px solid ${tab.color}50`,
                  }
                : {
                    background: "transparent",
                    border: "1px solid transparent",
                  }
            }
            data-ocid={`prayer_guide.${tab.id}.tab`}
          >
            <span
              className="text-[11px] font-semibold transition-colors leading-tight"
              style={{
                color: activeTab === tab.id ? tab.color : "oklch(0.5 0 0)",
              }}
            >
              {tabLabels[tab.id]}
            </span>
            <span
              className="text-[9px] transition-colors leading-tight mt-0.5"
              style={{
                color:
                  activeTab === tab.id ? `${tab.color}80` : "oklch(0.35 0 0)",
              }}
            >
              {tabRakaat[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-foreground/5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: currentGuide.color }}
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Step content — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <StepSlide
            key={`${activeTab}-${stepIdx}`}
            step={step}
            total={steps.length}
            direction={direction}
            accentColor={currentGuide.color}
          />
        </AnimatePresence>
      </div>

      {/* Step dots */}
      <div className="flex-shrink-0 flex items-center justify-center gap-1 py-2 px-4 flex-wrap max-h-10 overflow-hidden">
        {steps.map((s, i) => (
          <button
            key={s.stepNumber}
            type="button"
            onClick={() => {
              setDirection(i > stepIdx ? 1 : -1);
              setStepIdx(i);
            }}
            className="transition-all duration-200 rounded-full focus-visible:outline-none flex-shrink-0"
            style={{
              width: i === stepIdx ? "18px" : "5px",
              height: "5px",
              background:
                i === stepIdx
                  ? currentGuide.color
                  : i < stepIdx
                    ? `${currentGuide.color}55`
                    : "oklch(0.28 0 0)",
            }}
            aria-label={`Шаг ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation controls */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-4"
        style={{ borderTop: "1px solid oklch(0.55 0.18 45 / 0.08)" }}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIdx === 0}
          className="flex items-center gap-2 text-sm font-semibold transition-all duration-200 disabled:opacity-25"
          style={{
            color: stepIdx === 0 ? "oklch(0.4 0 0)" : currentGuide.color,
          }}
          data-ocid="prayer_guide.prev_button"
        >
          <ChevronLeft size={20} />
          <span>{tr("guide.back", lang)}</span>
        </button>

        <div className="text-center">
          <span className="text-sm font-bold text-foreground/40">
            {stepIdx + 1} / {steps.length}
          </span>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={stepIdx === steps.length - 1}
          className="flex items-center gap-2 text-sm font-semibold transition-all duration-200 disabled:opacity-25"
          style={{
            color:
              stepIdx === steps.length - 1
                ? "oklch(0.4 0 0)"
                : currentGuide.color,
          }}
          data-ocid="prayer_guide.next_button"
        >
          <span>{tr("guide.next", lang)}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
