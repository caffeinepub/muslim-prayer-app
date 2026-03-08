import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { quranFullText } from "../data/quranFullText";
import { type Surah, quranSurahs } from "../data/quranSurahs";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ayah {
  number: number;
  arabic: string;
  translation: string;
}

// ─── Local cache from quranFullText ──────────────────────────────────────────
// Build a map: surahNumber -> ayahs (only surahs with COMPLETE data)
const localCompleteAyahs: Record<number, Ayah[]> = {};
for (const surah of quranFullText) {
  const meta = quranSurahs.find((s) => s.number === surah.number);
  if (meta && surah.ayahs.length === meta.verses) {
    // Complete local data
    localCompleteAyahs[surah.number] = surah.ayahs.map((a) => ({
      number: a.n,
      arabic: a.ar,
      translation: a.ru,
    }));
  }
}

// ─── Persistent cache via localStorage ───────────────────────────────────────
const CACHE_KEY_PREFIX = "quran_surah_";
const CACHE_KEY_AR_FULL = "quran_cdn_arabic_full";
const CACHE_KEY_RU_FULL = "quran_cdn_russian_full";

function getCachedSurah(number: number): Ayah[] | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${number}`);
    if (raw) return JSON.parse(raw) as Ayah[];
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedSurah(number: number, ayahs: Ayah[]) {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${number}`, JSON.stringify(ayahs));
  } catch {
    /* ignore - storage full */
  }
}

// fawazahmed0 CDN structure: { "1": { "1": "text", "2": "text" }, "2": { ... } }
type QuranCDNData = Record<string, Record<string, string>>;

let _arFullCache: QuranCDNData | null = null;
let _ruFullCache: QuranCDNData | null = null;

function loadCDNFromStorage(key: string): QuranCDNData | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as QuranCDNData;
  } catch {
    /* ignore */
  }
  return null;
}

function saveCDNToStorage(key: string, data: QuranCDNData) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage full — skip caching */
  }
}

async function fetchFullCDN(): Promise<{ ar: QuranCDNData; ru: QuranCDNData }> {
  // Return in-memory if already loaded
  if (_arFullCache && _ruFullCache) {
    return { ar: _arFullCache, ru: _ruFullCache };
  }

  // Try localStorage first (avoid re-downloading on every visit)
  const cachedAr = loadCDNFromStorage(CACHE_KEY_AR_FULL);
  const cachedRu = loadCDNFromStorage(CACHE_KEY_RU_FULL);
  if (cachedAr && cachedRu) {
    _arFullCache = cachedAr;
    _ruFullCache = cachedRu;
    return { ar: cachedAr, ru: cachedRu };
  }

  // Fetch both editions in parallel from jsdelivr CDN (no CORS issues, very fast)
  const [arRes, ruRes] = await Promise.all([
    fetch(
      "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara.json",
      { cache: "force-cache" },
    ),
    fetch(
      "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/rus-kuliev.json",
      { cache: "force-cache" },
    ),
  ]);

  if (!arRes.ok || !ruRes.ok) {
    throw new Error("CDN fetch failed");
  }

  const [arData, ruData] = await Promise.all([arRes.json(), ruRes.json()]);

  _arFullCache = arData as QuranCDNData;
  _ruFullCache = ruData as QuranCDNData;

  saveCDNToStorage(CACHE_KEY_AR_FULL, _arFullCache);
  saveCDNToStorage(CACHE_KEY_RU_FULL, _ruFullCache);

  return { ar: _arFullCache, ru: _ruFullCache };
}

function extractSurahFromCDN(
  ar: QuranCDNData,
  ru: QuranCDNData,
  surahNumber: number,
): Ayah[] {
  const arSurah = ar[String(surahNumber)] ?? {};
  const ruSurah = ru[String(surahNumber)] ?? {};
  return Object.entries(arSurah).map(([ayahKey, arabicText]) => {
    const n = Number(ayahKey);
    return {
      number: n,
      arabic: arabicText,
      translation: ruSurah[ayahKey] ?? "",
    };
  });
}

// ─── Fetch surah from API (with fallback chain) ───────────────────────────────
async function fetchSurahFromAPI(number: number): Promise<Ayah[]> {
  // Primary: fawazahmed0 jsdelivr CDN (fast, no CORS)
  try {
    const { ar, ru } = await fetchFullCDN();
    const ayahs = extractSurahFromCDN(ar, ru, number);
    if (ayahs.length > 0) return ayahs;
  } catch {
    /* fall through to backup */
  }

  // Fallback: api.alquran.cloud
  const [arRes, ruRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${number}`),
    fetch(`https://api.alquran.cloud/v1/surah/${number}/ru.kuliev`),
  ]);

  if (!arRes.ok || !ruRes.ok) {
    throw new Error("All sources failed");
  }

  const [arData, ruData] = await Promise.all([arRes.json(), ruRes.json()]);

  const arAyahs: { numberInSurah: number; text: string }[] =
    arData?.data?.ayahs ?? [];
  const ruAyahs: { numberInSurah: number; text: string }[] =
    ruData?.data?.ayahs ?? [];

  const ruMap: Record<number, string> = {};
  for (const a of ruAyahs) {
    ruMap[a.numberInSurah] = a.text;
  }

  return arAyahs.map((a) => ({
    number: a.numberInSurah,
    arabic: a.text,
    translation: ruMap[a.numberInSurah] ?? "",
  }));
}

// ─── Decorative SVG ornament for surah header ─────────────────────────────────
function SurahOrnament({ name }: { name: string }) {
  return (
    <div
      className="relative flex items-center justify-center w-full mb-1"
      style={{ background: "transparent" }}
    >
      <div
        className="relative w-full flex items-center justify-center py-3 px-4 rounded-lg overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 100%)",
          border: "2px solid #66bb6a",
          boxShadow: "0 2px 8px rgba(76,175,80,0.15)",
        }}
      >
        {/* Left flower */}
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
        {/* Right flower */}
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
        <div className="absolute left-12 right-12 top-1 h-px bg-green-600/30" />
        <div className="absolute left-12 right-12 bottom-1 h-px bg-green-600/30" />
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

// ─── Ayah number medallion ────────────────────────────────────────────────────
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

// ─── Full reading view for a surah ───────────────────────────────────────────
function SurahReadingView({
  surah,
  onBack,
}: { surah: Surah; onBack: () => void }) {
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Check complete local data
      if (localCompleteAyahs[surah.number]) {
        setAyahs(localCompleteAyahs[surah.number]);
        return;
      }

      // 2. Check localStorage cache
      const cached = getCachedSurah(surah.number);
      if (cached && cached.length === surah.verses) {
        setAyahs(cached);
        return;
      }

      // 3. Fetch from API
      setLoading(true);
      setError(null);
      try {
        const fetched = await fetchSurahFromAPI(surah.number);
        if (!cancelled) {
          setAyahs(fetched);
          setCachedSurah(surah.number, fetched);
        }
      } catch {
        if (!cancelled) {
          // Fallback: use partial local data if available
          const partial = quranFullText.find((s) => s.number === surah.number);
          if (partial && partial.ayahs.length > 0) {
            setAyahs(
              partial.ayahs.map((a) => ({
                number: a.n,
                arabic: a.ar,
                translation: a.ru,
              })),
            );
          } else {
            setError(
              "Не удалось загрузить текст суры. Проверьте подключение к интернету.",
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [surah.number, surah.verses]);

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
          {ayahs && (
            <div className="text-[10px]" style={{ color: "#4caf50" }}>
              {ayahs.length} аятов
            </div>
          )}
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

        {/* Loading state */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-4"
            data-ocid="quran.reading.loading_state"
          >
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: "#4caf50" }}
            />
            <p className="text-sm" style={{ color: "#4caf50" }}>
              Загрузка текста суры...
            </p>
            <p className="text-xs text-center" style={{ color: "#888" }}>
              Источник: cdn.jsdelivr.net (quran-api)
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: "rgba(244,67,54,0.07)",
              border: "1px solid rgba(244,67,54,0.2)",
            }}
            data-ocid="quran.reading.error_state"
          >
            <p className="text-sm" style={{ color: "#c62828" }}>
              {error}
            </p>
          </div>
        )}

        {/* Ayahs */}
        {ayahs && !loading && (
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
                {ayah.translation && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
          <BookOpen size={16} className="text-islamic-500" />
          <h2 className="text-xl font-display font-bold text-gradient-orange">
            Священный Коран
          </h2>
          <BookOpen size={16} className="text-islamic-500" />
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
              className="w-full glass-card rounded-xl px-4 py-3 flex items-center gap-3 hover:border-islamic-500/30 transition-all duration-200 text-left group"
              onClick={() => setSelectedSurah(surah)}
              data-ocid={`quran.surah.item.${surah.number}`}
            >
              {/* Number badge */}
              <div className="w-9 h-9 rounded-lg bg-islamic-500/10 border border-islamic-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-islamic-400">
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
                    className="text-[9px] px-1 py-0 border-islamic-500/20 text-islamic-400/60 shrink-0"
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
                className="text-lg font-bold text-foreground/70 group-hover:text-islamic-400 transition-colors shrink-0"
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
