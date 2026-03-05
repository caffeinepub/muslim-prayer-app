import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { type Surah, quranSurahs } from "../data/quranSurahs";

// Ayah data for surahs with full text
interface Ayah {
  number: number;
  arabic: string;
  translation: string;
}

const surahTexts: Record<number, Ayah[]> = {
  1: [
    {
      number: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "Во имя Аллаха, Милостивого, Милосердного!",
    },
    {
      number: 2,
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "Хвала Аллаху, Господу миров,",
    },
    {
      number: 3,
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "Милостивому, Милосердному,",
    },
    {
      number: 4,
      arabic: "مَالِكِ يَوْمِ الدِّينِ",
      translation: "Владыке Дня воздаяния!",
    },
    {
      number: 5,
      arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translation: "Тебе одному мы поклоняемся и Тебя одного молим о помощи.",
    },
    {
      number: 6,
      arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translation: "Веди нас прямым путём,",
    },
    {
      number: 7,
      arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      translation:
        "путём тех, кого Ты облагодетельствовал, не тех, на кого Ты разгневался, и не заблудших.",
    },
  ],
  112: [
    {
      number: 1,
      arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translation: "Скажи: «Он — Аллах Единый,",
    },
    { number: 2, arabic: "اللَّهُ الصَّمَدُ", translation: "Аллах Вечный." },
    {
      number: 3,
      arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
      translation: "Он не родил и не был рождён,",
    },
    {
      number: 4,
      arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
      translation: "и нет никого равного Ему».",
    },
  ],
  113: [
    {
      number: 1,
      arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
      translation: "Скажи: «Прибегаю к защите Господа рассвета",
    },
    {
      number: 2,
      arabic: "مِن شَرِّ مَا خَلَقَ",
      translation: "от зла того, что Он сотворил,",
    },
    {
      number: 3,
      arabic: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
      translation: "от зла мрака, когда он наступает,",
    },
    {
      number: 4,
      arabic: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
      translation: "от зла колдуний, дующих на узлы,",
    },
    {
      number: 5,
      arabic: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      translation: "от зла завистника, когда он завидует».",
    },
  ],
  114: [
    {
      number: 1,
      arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
      translation: "Скажи: «Прибегаю к защите Господа людей,",
    },
    { number: 2, arabic: "مَلِكِ النَّاسِ", translation: "Царя людей," },
    { number: 3, arabic: "إِلَٰهِ النَّاسِ", translation: "Бога людей," },
    {
      number: 4,
      arabic: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
      translation: "от зла искусителя исчезающего,",
    },
    {
      number: 5,
      arabic: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
      translation: "который нашёптывает в груди людей,",
    },
    {
      number: 6,
      arabic: "مِنَ الْجِنَّةِ وَالنَّاسِ",
      translation: "будь то джинны или люди».",
    },
  ],
};

// Decorative SVG ornament for surah header
function SurahOrnament({ name }: { name: string }) {
  return (
    <div
      className="relative flex items-center justify-center w-full mb-1"
      style={{ background: "transparent" }}
    >
      {/* Ornamental border box */}
      <div
        className="relative w-full flex items-center justify-center py-3 px-4 rounded-lg overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 100%)",
          border: "2px solid #66bb6a",
          boxShadow: "0 2px 8px rgba(76,175,80,0.15)",
        }}
      >
        {/* Left flower decoration */}
        <svg
          role="img"
          aria-label="Декоративный орнамент"
          className="absolute left-2 top-1/2 -translate-y-1/2"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
        >
          <circle cx="18" cy="18" r="5" fill="#4caf50" opacity="0.4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx={18 + 10 * Math.cos((deg * Math.PI) / 180)}
              cy={18 + 10 * Math.sin((deg * Math.PI) / 180)}
              rx="4"
              ry="2.5"
              transform={`rotate(${deg} ${18 + 10 * Math.cos((deg * Math.PI) / 180)} ${18 + 10 * Math.sin((deg * Math.PI) / 180)})`}
              fill="#66bb6a"
              opacity="0.5"
            />
          ))}
        </svg>
        {/* Right flower decoration */}
        <svg
          role="img"
          aria-label="Декоративный орнамент"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
        >
          <circle cx="18" cy="18" r="5" fill="#4caf50" opacity="0.4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx={18 + 10 * Math.cos((deg * Math.PI) / 180)}
              cy={18 + 10 * Math.sin((deg * Math.PI) / 180)}
              rx="4"
              ry="2.5"
              transform={`rotate(${deg} ${18 + 10 * Math.cos((deg * Math.PI) / 180)} ${18 + 10 * Math.sin((deg * Math.PI) / 180)})`}
              fill="#66bb6a"
              opacity="0.5"
            />
          ))}
        </svg>
        {/* Horizontal lines */}
        <div className="absolute left-12 right-12 top-1 h-px bg-green-600/30" />
        <div className="absolute left-12 right-12 bottom-1 h-px bg-green-600/30" />
        {/* Arabic name */}
        <span
          className="text-2xl font-bold"
          style={{
            fontFamily: "serif",
            direction: "rtl",
            color: "#1a3c1a",
            textShadow: "0 1px 2px rgba(0,0,0,0.08)",
            letterSpacing: "0.04em",
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

// Ayah number medallion (like in Muslim Pro)
function AyahMedallion({ number }: { number: number }) {
  return (
    <div className="flex-shrink-0 w-8 h-8 relative flex items-center justify-center">
      <svg
        role="img"
        aria-label="Номер аята"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <polygon
          points="16,1 20,11 31,11 22,18 25,29 16,22 7,29 10,18 1,11 12,11"
          fill="none"
          stroke="#4caf50"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <circle
          cx="16"
          cy="16"
          r="8"
          fill="none"
          stroke="#4caf50"
          strokeWidth="0.8"
          opacity="0.4"
        />
      </svg>
      <span
        className="absolute text-[9px] font-bold"
        style={{ color: "#2e7d32" }}
      >
        {number}
      </span>
    </div>
  );
}

// Full reading view for a surah
function SurahReadingView({
  surah,
  onBack,
}: { surah: Surah; onBack: () => void }) {
  const ayahs = surahTexts[surah.number];
  const hasFullText = !!ayahs;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#faf8f0" }}
      data-ocid="quran.reading.panel"
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#faf8f0",
          borderBottom: "1px solid rgba(76,175,80,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#2e7d32" }}
          onClick={onBack}
          data-ocid="quran.reading.back_button"
        >
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: "#2e7d32" }}>
            {surah.number}. {surah.nameRu}
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-4 py-5 pb-24">
        {/* Surah header ornament */}
        <SurahOrnament name={surah.arabic} />

        {/* Basmala */}
        {surah.number !== 1 && surah.number !== 9 && (
          <div
            className="text-center text-2xl my-6 leading-loose"
            style={{ fontFamily: "serif", direction: "rtl", color: "#1a1a1a" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}

        {/* Info row */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              background: "rgba(76,175,80,0.12)",
              color: "#2e7d32",
              border: "1px solid rgba(76,175,80,0.25)",
            }}
          >
            {surah.place}
          </span>
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              background: "rgba(76,175,80,0.12)",
              color: "#2e7d32",
              border: "1px solid rgba(76,175,80,0.25)",
            }}
          >
            {surah.verses} аятов
          </span>
        </div>

        {/* Ayahs */}
        {hasFullText ? (
          <div className="space-y-0">
            {ayahs.map((ayah, idx) => (
              <div
                key={ayah.number}
                className="py-4"
                style={{
                  borderBottom:
                    idx < ayahs.length - 1
                      ? "1px solid rgba(76,175,80,0.12)"
                      : "none",
                }}
                data-ocid={`quran.ayah.item.${ayah.number}`}
              >
                {/* Arabic text with ayah number medallion at end */}
                <div
                  className="flex items-start gap-2 justify-end mb-2"
                  style={{ direction: "rtl" }}
                >
                  <p
                    className="text-right leading-loose flex-1"
                    style={{
                      fontFamily: "serif",
                      fontSize: "1.5rem",
                      color: "#1a1a1a",
                      lineHeight: "2.2",
                    }}
                  >
                    {ayah.arabic}
                  </p>
                  <div className="mt-2 flex-shrink-0">
                    <AyahMedallion number={ayah.number} />
                  </div>
                </div>
                {/* Translation */}
                <p
                  className="text-sm leading-relaxed mt-1"
                  style={{ color: "#5a5a5a", lineHeight: "1.7" }}
                >
                  <span
                    style={{
                      color: "#4caf50",
                      fontWeight: 600,
                      marginRight: "4px",
                    }}
                  >
                    {ayah.number}.
                  </span>
                  {ayah.translation}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* No full text available - show description + prompt */
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(76,175,80,0.07)",
                border: "1px solid rgba(76,175,80,0.2)",
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#4caf50" }}
              >
                О суре
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                {surah.descriptionRu}
              </p>
            </div>

            {/* Arabic name large */}
            <div
              className="text-center py-8"
              style={{
                fontFamily: "serif",
                direction: "rtl",
                fontSize: "3rem",
                color: "#1a3c1a",
              }}
            >
              {surah.arabic}
            </div>

            <div
              className="text-center text-sm rounded-2xl py-4 px-5"
              style={{
                background: "rgba(76,175,80,0.07)",
                border: "1px dashed rgba(76,175,80,0.3)",
                color: "#666",
              }}
            >
              Полный текст этой суры содержит {surah.verses} аятов.
              <br />
              <span style={{ color: "#4caf50" }}>
                Скоро будет добавлен полный текст.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function trackSurahRead(surahNumber: number) {
  try {
    const raw = localStorage.getItem("quran_read_surahs");
    const readIds: number[] = raw ? JSON.parse(raw) : [];
    if (!readIds.includes(surahNumber)) {
      readIds.push(surahNumber);
      localStorage.setItem("quran_read_surahs", JSON.stringify(readIds));
    }
  } catch {
    /* ignore */
  }
}

export default function QuranTab() {
  const [search, setSearch] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return quranSurahs;
    return quranSurahs.filter(
      (s) =>
        s.nameRu.toLowerCase().includes(q) ||
        s.transliteration.toLowerCase().includes(q) ||
        s.arabic.includes(q) ||
        String(s.number).includes(q),
    );
  }, [search]);

  const handleSelectSurah = (surah: Surah) => {
    trackSurahRead(surah.number);
    setSelectedSurah(surah);
  };

  // Full reading view
  if (selectedSurah) {
    return (
      <SurahReadingView
        surah={selectedSurah}
        onBack={() => setSelectedSurah(null)}
      />
    );
  }

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-1">
          <BookOpen size={16} className="text-orange-500" />
          <h2 className="text-xl font-display font-bold text-gradient-orange">
            Священный Коран
          </h2>
          <BookOpen size={16} className="text-orange-500" />
        </div>
        <p className="text-foreground/40 text-xs">
          114 сур — на арабском и по-русски
        </p>
        <div
          className="text-2xl mt-2 text-foreground/20"
          style={{ fontFamily: "serif", direction: "rtl" }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
        />
        <Input
          placeholder="Поиск суры по названию или номеру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-foreground/30 text-sm"
          data-ocid="quran.search_input"
        />
      </div>

      {/* Count */}
      <div className="text-xs text-foreground/30 mb-3 text-right">
        {filtered.length} из 114 сур
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 text-foreground/30"
          data-ocid="quran.empty_state"
        >
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">Ничего не найдено</p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((surah) => (
            <button
              type="button"
              key={surah.number}
              className="w-full glass-card rounded-xl px-4 py-3 flex items-center gap-3 hover:border-orange-500/30 transition-all duration-200 text-left group"
              onClick={() => handleSelectSurah(surah)}
              data-ocid={`quran.surah.item.${surah.number}`}
            >
              {/* Number badge */}
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-orange-400">
                  {surah.number}
                </span>
              </div>

              {/* Names */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-sm truncate">
                    {surah.nameRu}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 border-orange-500/20 text-orange-400/60 shrink-0"
                  >
                    {surah.place}
                  </Badge>
                </div>
                <div className="text-foreground/40 text-xs">
                  {surah.transliteration} · {surah.verses} аятов
                </div>
              </div>

              {/* Arabic name */}
              <div
                className="text-lg font-bold text-foreground/70 group-hover:text-orange-400 transition-colors shrink-0"
                style={{ fontFamily: "serif", direction: "rtl" }}
              >
                {surah.arabic}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
