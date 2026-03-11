import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Pause,
  Play,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { quranFullText } from "../data/quranFullText";
import { type Surah, quranSurahs } from "../data/quranSurahs";

// ─── API Configuration ────────────────────────────────────────────────────────
// Primary: api.alquran.cloud — доступен в России без VPN, единый запрос
// Fallback: cdn.jsdelivr.net (fawazahmed0/quran-api)
const CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ayah {
  number: number;
  arabic: string;
  translation: string;
  audioUrl: string | null;
}

interface FawazAyah {
  verse: number;
  text: string;
}

interface FawazEditionData {
  chapter: FawazAyah[];
}

// ─── Local cache from quranFullText ──────────────────────────────────────────
const localCompleteAyahs: Record<number, Ayah[]> = {};
for (const surah of quranFullText) {
  const meta = quranSurahs.find((s) => s.number === surah.number);
  if (meta && surah.ayahs.length === meta.verses) {
    localCompleteAyahs[surah.number] = surah.ayahs.map((a) => ({
      number: a.n,
      arabic: a.ar,
      translation: a.ru,
      audioUrl: null,
    }));
  }
}

// ─── Persistent cache via localStorage ───────────────────────────────────────
const CACHE_V5_PREFIX = "quran_v5_surah_";

function getCachedSurah(number: number): Ayah[] | null {
  try {
    const raw = localStorage.getItem(`${CACHE_V5_PREFIX}${number}`);
    if (raw) return JSON.parse(raw) as Ayah[];
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedSurah(number: number, ayahs: Ayah[]) {
  try {
    localStorage.setItem(`${CACHE_V5_PREFIX}${number}`, JSON.stringify(ayahs));
  } catch {
    /* storage full */
  }
}

// ─── api.alquran.cloud fetcher (primary — доступен в России без VPN) ─────────
async function fetchSurahFromAlquranCloud(
  surahNumber: number,
): Promise<Ayah[]> {
  const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ru.kuliev`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`alquran.cloud error: ${res.status}`);
  const json = await res.json();
  // Response: { data: [ {ayahs: [{numberInSurah, text}]}, {ayahs: [{numberInSurah, text}]} ] }
  const editions: { ayahs: { numberInSurah: number; text: string }[] }[] =
    json?.data ?? [];
  if (editions.length < 1) throw new Error("Empty response from alquran.cloud");
  const arabicAyahs = editions[0]?.ayahs ?? [];
  const ruAyahs = editions[1]?.ayahs ?? [];
  const ruMap: Record<number, string> = {};
  for (const a of ruAyahs) {
    ruMap[a.numberInSurah] = a.text;
  }
  return arabicAyahs.map((a) => {
    const surahPad = String(surahNumber).padStart(3, "0");
    const ayahPad = String(a.numberInSurah).padStart(3, "0");
    return {
      number: a.numberInSurah,
      arabic: a.text,
      translation: ruMap[a.numberInSurah] ?? "",
      audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${surahPad}${ayahPad}.mp3`,
    };
  });
}

// ─── jsdelivr CDN fetcher (fallback) ─────────────────────────────────────────
async function fetchSurahFromCDN(surahNumber: number): Promise<Ayah[]> {
  const arabicUrl = `${CDN_BASE}/ara-quranindopak/${surahNumber}.json`;
  const russianUrl = `${CDN_BASE}/rus-kuliyev/${surahNumber}.json`;

  const [arabicRes, russianRes] = await Promise.all([
    fetch(arabicUrl),
    fetch(russianUrl),
  ]);

  if (!arabicRes.ok) throw new Error(`CDN Arabic error: ${arabicRes.status}`);

  const arabicData: FawazEditionData = await arabicRes.json();
  let ruMap: Record<number, string> = {};
  if (russianRes.ok) {
    const russianData: FawazEditionData = await russianRes.json();
    for (const a of russianData.chapter) {
      ruMap[a.verse] = a.text;
    }
  }

  return arabicData.chapter.map((a) => {
    const ayahNum = a.verse;
    const surahPad = String(surahNumber).padStart(3, "0");
    const ayahPad = String(ayahNum).padStart(3, "0");
    return {
      number: ayahNum,
      arabic: a.text,
      translation: ruMap[ayahNum] ?? "",
      audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${surahPad}${ayahPad}.mp3`,
    };
  });
}

// ─── Main fetch function with fallback chain ──────────────────────────────────
async function fetchSurahAyahs(
  surah: Surah,
  _onProgress?: (page: number, total: number) => void,
): Promise<Ayah[]> {
  // 1. Local complete data
  if (localCompleteAyahs[surah.number]) {
    return localCompleteAyahs[surah.number];
  }
  // 2. localStorage cache
  const cached = getCachedSurah(surah.number);
  if (cached && cached.length >= surah.verses) {
    return cached;
  }
  // 3. api.alquran.cloud (primary — доступен в России без VPN)
  try {
    const ayahs = await fetchSurahFromAlquranCloud(surah.number);
    if (ayahs.length > 0) {
      setCachedSurah(surah.number, ayahs);
      return ayahs;
    }
  } catch {
    /* fall through to CDN fallback */
  }
  // 4. jsdelivr CDN fallback
  try {
    const ayahs = await fetchSurahFromCDN(surah.number);
    if (ayahs.length > 0) {
      setCachedSurah(surah.number, ayahs);
      return ayahs;
    }
  } catch {
    /* fall through to local fallback */
  }
  // 5. Local fallback (partial data if available)
  const partial = quranFullText.find((s) => s.number === surah.number);
  if (partial && partial.ayahs.length > 0) {
    return partial.ayahs.map((a) => ({
      number: a.n,
      arabic: a.ar,
      translation: a.ru,
      audioUrl: null,
    }));
  }
  throw new Error("All sources failed");
}

// ─── Decorative SVG ornament for surah header ─────────────────────────────────
function SurahOrnament({ name }: { name: string }) {
  return (
    <div className="relative flex items-center justify-center w-full mb-1">
      <div
        className="relative w-full flex items-center justify-center py-3 px-4 rounded-lg overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 100%)",
          border: "2px solid #66bb6a",
          boxShadow: "0 2px 8px rgba(76,175,80,0.15)",
        }}
      >
        <svg
          role="img"
          aria-label="Орнамент"
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
        <svg
          role="img"
          aria-label="Орнамент"
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

// ─── Audio Player Bar ─────────────────────────────────────────────────────────
function AudioPlayerBar({
  surahName,
  ayahs,
  playingAyah,
  isPlayingFull,
  onPlayFull,
  onPauseFull,
}: {
  surahName: string;
  ayahs: Ayah[];
  playingAyah: number | null;
  isPlayingFull: boolean;
  onPlayFull: () => void;
  onPauseFull: () => void;
}) {
  const hasAudio = ayahs.some((a) => a.audioUrl !== null);

  if (!hasAudio) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
      style={{
        background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)",
        border: "1px solid rgba(76,175,80,0.3)",
      }}
      data-ocid="quran.audio.panel"
    >
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 active:scale-95"
        style={{
          background: isPlayingFull ? "#2e7d32" : "rgba(76,175,80,0.15)",
          color: isPlayingFull ? "#fff" : "#2e7d32",
          border: "1px solid rgba(76,175,80,0.4)",
        }}
        onClick={isPlayingFull ? onPauseFull : onPlayFull}
        data-ocid="quran.audio.primary_button"
      >
        {isPlayingFull ? <Pause size={14} /> : <Play size={14} />}
        <span>{isPlayingFull ? "Пауза" : "▶ Слушать суру"}</span>
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium truncate"
          style={{ color: "#1a3c1a" }}
        >
          {surahName}
        </p>
        {playingAyah !== null && (
          <p className="text-[10px]" style={{ color: "#4caf50" }}>
            Аят {playingAyah}
          </p>
        )}
        {isPlayingFull && playingAyah === null && (
          <p className="text-[10px]" style={{ color: "#4caf50" }}>
            Полная сура
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Volume2 size={14} style={{ color: "#4caf50" }} />
        <span className="text-[10px]" style={{ color: "#4caf50" }}>
          Алафаси
        </span>
      </div>
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

  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const ayahAudioRef = useRef<HTMLAudioElement | null>(null);
  const fullAudioRef = useRef<HTMLAudioElement | null>(null);
  const playingAyahRef = useRef<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on number only
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const fetched = await fetchSurahAyahs(surah);
        if (!cancelled) {
          setAyahs(fetched);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Не удалось загрузить текст суры. Проверьте подключение к интернету.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [surah.number]);

  useEffect(() => {
    return () => {
      ayahAudioRef.current?.pause();
      fullAudioRef.current?.pause();
    };
  }, []);

  function stopAllAudio() {
    ayahAudioRef.current?.pause();
    if (ayahAudioRef.current) {
      ayahAudioRef.current.currentTime = 0;
      ayahAudioRef.current = null;
    }
    fullAudioRef.current?.pause();
    if (fullAudioRef.current) {
      fullAudioRef.current.currentTime = 0;
      fullAudioRef.current = null;
    }
    setPlayingAyah(null);
    setIsPlayingFull(false);
    playingAyahRef.current = null;
  }

  function playAyahSequentially(allAyahs: Ayah[], index: number) {
    if (index >= allAyahs.length) {
      setPlayingAyah(null);
      setIsPlayingFull(false);
      return;
    }
    const ayah = allAyahs[index];
    if (!ayah.audioUrl) {
      playAyahSequentially(allAyahs, index + 1);
      return;
    }
    setPlayingAyah(ayah.number);
    playingAyahRef.current = ayah.number;
    setIsPlayingFull(true);
    const audio = new Audio(ayah.audioUrl);
    audio.muted = isMuted;
    ayahAudioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => playAyahSequentially(allAyahs, index + 1);
    audio.onerror = () => playAyahSequentially(allAyahs, index + 1);
  }

  function handlePlayFull() {
    stopAllAudio();
    if (ayahs && ayahs.length > 0) {
      playAyahSequentially(ayahs, 0);
    }
  }

  function handlePauseFull() {
    ayahAudioRef.current?.pause();
    fullAudioRef.current?.pause();
    setIsPlayingFull(false);
    setPlayingAyah(null);
    playingAyahRef.current = null;
  }

  function handlePlayAyah(ayahNumber: number) {
    const ayah = ayahs?.find((a) => a.number === ayahNumber);
    if (!ayah?.audioUrl) return;
    stopAllAudio();
    setPlayingAyah(ayahNumber);
    playingAyahRef.current = ayahNumber;
    const audio = new Audio(ayah.audioUrl);
    audio.muted = isMuted;
    ayahAudioRef.current = audio;
    audio.play().catch(() => setPlayingAyah(null));
    audio.onended = () => {
      setPlayingAyah(null);
      ayahAudioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingAyah(null);
      ayahAudioRef.current = null;
    };
  }

  function handlePauseAyah() {
    ayahAudioRef.current?.pause();
    setPlayingAyah(null);
    playingAyahRef.current = null;
  }

  function toggleMute() {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (ayahAudioRef.current) ayahAudioRef.current.muted = newMuted;
    if (fullAudioRef.current) fullAudioRef.current.muted = newMuted;
  }

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
          onClick={() => {
            stopAllAudio();
            onBack();
          }}
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
        <button
          type="button"
          className="p-2 rounded-full"
          style={{ color: isMuted ? "#bbb" : "#4caf50" }}
          onClick={toggleMute}
          title={isMuted ? "Включить звук" : "Выключить звук"}
          data-ocid="quran.audio.toggle"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-4 py-5 pb-24">
        <SurahOrnament name={surah.arabic} />

        {surah.number !== 1 && surah.number !== 9 && (
          <div
            className="text-center text-2xl my-6 leading-loose"
            style={{ fontFamily: "serif", direction: "rtl", color: "#1a1a1a" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-4">
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

        {ayahs && !loading && (
          <AudioPlayerBar
            surahName={surah.nameRu}
            ayahs={ayahs}
            playingAyah={playingAyah}
            isPlayingFull={isPlayingFull}
            onPlayFull={handlePlayFull}
            onPauseFull={handlePauseFull}
          />
        )}

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
            <p className="text-sm font-medium" style={{ color: "#2e7d32" }}>
              Загрузка текста суры...
            </p>
            <p className="text-xs text-center" style={{ color: "#888" }}>
              Источник: api.alquran.cloud
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
            {ayahs.map((ayah, idx) => {
              const isActive = playingAyah === ayah.number;
              return (
                <div
                  key={ayah.number}
                  className="py-4 transition-all duration-300"
                  style={{
                    borderBottom:
                      idx < ayahs.length - 1
                        ? "1px solid rgba(76,175,80,0.12)"
                        : "none",
                    borderLeft: isActive
                      ? "3px solid #4caf50"
                      : "3px solid transparent",
                    paddingLeft: isActive ? "12px" : "0",
                    background: isActive
                      ? "rgba(76,175,80,0.05)"
                      : "transparent",
                    borderRadius: isActive ? "0 8px 8px 0" : "0",
                  }}
                  data-ocid={`quran.ayah.item.${ayah.number}`}
                >
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
                    <div className="mt-2 flex flex-col items-center gap-1 flex-shrink-0">
                      <AyahMedallion number={ayah.number} />
                      {ayah.audioUrl && (
                        <button
                          type="button"
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                          style={{
                            background: isActive
                              ? "#4caf50"
                              : "rgba(76,175,80,0.15)",
                            color: isActive ? "#fff" : "#4caf50",
                            border: "1px solid rgba(76,175,80,0.3)",
                          }}
                          onClick={() => {
                            if (isActive) {
                              handlePauseAyah();
                            } else {
                              handlePlayAyah(ayah.number);
                            }
                          }}
                          title={
                            isActive
                              ? "Остановить"
                              : `Воспроизвести аят ${ayah.number}`
                          }
                          data-ocid={`quran.ayah.toggle.${ayah.number}`}
                        >
                          {isActive ? <Pause size={10} /> : <Play size={10} />}
                        </button>
                      )}
                    </div>
                  </div>

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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main QuranTab component ──────────────────────────────────────────────────
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
          114 сур · арабский текст · перевод Кулиева · аудио Алафаси
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
              <div className="w-9 h-9 rounded-lg bg-islamic-500/10 border border-islamic-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-islamic-400">
                  {surah.number}
                </span>
              </div>

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
                <div className="flex items-center gap-2 text-foreground/40 text-xs">
                  <span>{surah.transliteration}</span>
                  <span>·</span>
                  <span>{surah.verses} аятов</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Volume2 size={9} />
                    аудио
                  </span>
                </div>
              </div>

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
