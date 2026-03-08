import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { type LangCode, tr, useLanguage } from "../hooks/useLanguage";

// ─── Pose image map ───────────────────────────────────────────────────────────
const POSE_IMAGES: Record<string, string> = {
  niyyah: "/assets/generated/prayer-niyyah.dim_400x500.png",
  standing: "/assets/generated/prayer-qiyam.dim_400x500.png",
  "hands-folded": "/assets/generated/prayer-qiyam.dim_400x500.png",
  ruku: "/assets/generated/prayer-ruku.dim_500x400.png",
  "standing-after-ruku": "/assets/generated/prayer-itidal.dim_400x500.png",
  sujud: "/assets/generated/prayer-sujud.dim_500x380.png",
  sitting: "/assets/generated/prayer-jalsa.dim_500x400.png",
  "sitting-tashahhud":
    "/assets/generated/prayer-tashahhud-fixed.dim_400x500.png",
  "salam-right": "/assets/generated/prayer-salam-right-fixed.dim_400x500.png",
  "salam-left": "/assets/generated/prayer-salam-left.dim_400x500.png",
};

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
      {(() => {
        const imgSrc = step.imageUrl || POSE_IMAGES[step.poseType];
        return imgSrc ? (
          <div
            className="relative rounded-3xl overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{
              width: "240px",
              height: "220px",
              background: "oklch(0.11 0.006 60)",
              border: `1px solid ${accentColor}25`,
              boxShadow: `0 0 32px ${accentColor}15`,
            }}
          >
            <img
              src={imgSrc}
              alt={step.name}
              className="w-full h-full object-cover rounded-3xl"
            />
            {step.repetitions && (
              <div
                className="absolute bottom-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: `${accentColor}30`,
                  color: accentColor,
                  border: `1px solid ${accentColor}50`,
                  backdropFilter: "blur(4px)",
                }}
              >
                {step.repetitions}
              </div>
            )}
          </div>
        ) : null;
      })()}

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
