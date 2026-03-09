import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
} from "adhan";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Locate,
  MapPin,
  Search,
  Settings,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PrayerSettings } from "../backend.d";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { tr, useLanguage } from "../hooks/useLanguage";
import {
  useGetPrayerSettings,
  useSavePrayerSettings,
} from "../hooks/useQueries";
import { formatGregorianRu, formatHijriRu, toHijri } from "../utils/hijriDate";
import { playPrayerCheck } from "../utils/sounds";

interface PrayerInfo {
  name: string;
  nameArabic: string;
  nameRu: string;
  time: Date | null;
  key: string;
}

const CALCULATION_METHODS = [
  { value: "MWL", label: "Лига мусульманского мира" },
  { value: "ISNA", label: "ISNA (Северная Америка)" },
  { value: "Egypt", label: "Египет" },
  { value: "Makkah", label: "Умм аль-Кура (Мекка)" },
  { value: "Karachi", label: "Карачи" },
  { value: "Tehran", label: "Тегеран" },
  { value: "Turkey", label: "Турция" },
];

const MADHABS = [
  { value: "Shafi", label: "Шафии / Маликии / Ханбали" },
  { value: "Hanafi", label: "Ханафи" },
];

function getCalculationParams(method: string) {
  switch (method) {
    case "MWL":
      return CalculationMethod.MuslimWorldLeague();
    case "ISNA":
      return CalculationMethod.NorthAmerica();
    case "Egypt":
      return CalculationMethod.Egyptian();
    case "Makkah":
      return CalculationMethod.UmmAlQura();
    case "Karachi":
      return CalculationMethod.Karachi();
    case "Tehran":
      return CalculationMethod.Tehran();
    case "Turkey":
      return CalculationMethod.Turkey();
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// Helper to read saved location from localStorage
function readStoredLocation(): {
  lat: number;
  lng: number;
  name: string;
} | null {
  try {
    const stored = localStorage.getItem("prayer_location");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.lat && parsed.lng) {
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          name: parsed.name || "Сохранённое местоположение",
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Helper to save location to localStorage
function saveStoredLocation(lat: number, lng: number, name: string) {
  try {
    localStorage.setItem("prayer_location", JSON.stringify({ lat, lng, name }));
  } catch {
    // ignore
  }
}

// ─── Prayer Tracking helpers ─────────────────────────────────────────────────
const PRAYER_TRACK_KEY = "prayer_completed_today";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function loadPrayersDone(): Set<string> {
  try {
    const raw = localStorage.getItem(PRAYER_TRACK_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { date: string; keys: string[] };
      // Always load saved keys regardless of date — reset only happens at midnight in real-time
      return new Set(data.keys);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function savePrayersDone(done: Set<string>) {
  try {
    localStorage.setItem(
      PRAYER_TRACK_KEY,
      JSON.stringify({ date: getTodayKey(), keys: Array.from(done) }),
    );
    // Also update total prayers count in achievements
    const total = Number(localStorage.getItem("prayers_checked") || "0");
    localStorage.setItem("prayers_checked", String(total + 1));
  } catch {
    // ignore
  }
}

export default function PrayerTimesTab() {
  const lang = useLanguage();

  // Initialize coords directly from localStorage so they never flash empty
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    () => {
      const stored = readStoredLocation();
      return stored ? { lat: stored.lat, lng: stored.lng } : null;
    },
  );
  const [locationName, setLocationName] = useState<string>(() => {
    const stored = readStoredLocation();
    return stored ? stored.name : "Не определено";
  });
  const [locationError, setLocationError] = useState(false);
  const [calcMethod, setCalcMethod] = useState("MWL");
  const [madhab, setMadhab] = useState("Shafi");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [now, setNow] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  // Only show prompt when there's no coords at all (not in localStorage)
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(() => {
    return readStoredLocation() === null;
  });
  const [citySearch, setCitySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // Track whether we've applied localStorage data to avoid re-showing prompt
  const localStorageApplied = useRef(readStoredLocation() !== null);
  // Prayer completion tracking
  const [prayersDone, setPrayersDone] = useState<Set<string>>(loadPrayersDone);

  const { identity } = useInternetIdentity();
  const { user: firebaseUser } = useFirebaseAuth();
  const isAuthorLoggedIn = sessionStorage.getItem("author_session") === "1";
  const isLoggedIn = !!identity || !!firebaseUser || isAuthorLoggedIn;
  const { data: savedSettings } = useGetPrayerSettings();
  const { mutate: saveSettings } = useSavePrayerSettings();

  // Tick every second; auto-reset prayers at midnight
  useEffect(() => {
    let lastDateKey = getTodayKey();
    const interval = setInterval(() => {
      const currentDateKey = getTodayKey();
      if (currentDateKey !== lastDateKey) {
        // New day — reset all prayer completions
        lastDateKey = currentDateKey;
        setPrayersDone(new Set());
        try {
          localStorage.setItem(
            PRAYER_TRACK_KEY,
            JSON.stringify({ date: currentDateKey, keys: [] }),
          );
        } catch {
          /* ignore */
        }
      }
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset prayer completions when the logged-in user changes
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const currentUserId =
      firebaseUser?.uid ?? (isAuthorLoggedIn ? "author" : null);
    if (prevUserIdRef.current === undefined) {
      // Initial mount — just record the current user, do not reset
      prevUserIdRef.current = currentUserId;
      return;
    }
    if (prevUserIdRef.current !== currentUserId) {
      // User changed (login, logout, or switch) — clear prayer completions
      prevUserIdRef.current = currentUserId;
      setPrayersDone(new Set());
      try {
        localStorage.setItem(
          PRAYER_TRACK_KEY,
          JSON.stringify({ date: getTodayKey(), keys: [] }),
        );
        localStorage.setItem("prayers_checked", "0");
      } catch {
        /* ignore */
      }
    }
  }, [firebaseUser?.uid, isAuthorLoggedIn]);

  // Load backend settings — only update if no localStorage data exists
  useEffect(() => {
    if (savedSettings === undefined) return;
    if (savedSettings === null) {
      // Backend has no settings — only show prompt if localStorage is also empty
      if (!localStorageApplied.current) {
        setShowLocationPrompt(true);
      }
      return;
    }
    // Apply method/madhab settings from backend always
    setCalcMethod(savedSettings.calculationMethod);
    setMadhab(savedSettings.madhab);
    // Only apply coords from backend if localStorage has nothing
    if (!localStorageApplied.current) {
      if (savedSettings.latitude && savedSettings.longitude) {
        const lat = savedSettings.latitude;
        const lng = savedSettings.longitude;
        const name = savedSettings.locationName || "Сохранённое местоположение";
        setCoords({ lat, lng });
        setLocationName(name);
        saveStoredLocation(lat, lng, name);
        localStorageApplied.current = true;
        setIsLoadingLocation(false);
        setShowLocationPrompt(false);
      } else {
        setShowLocationPrompt(true);
      }
    }
  }, [savedSettings]);

  // Reverse geocode: get city name from coords
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        { headers: { "Accept-Language": "ru" } },
      );
      const data = await res.json();
      if (data?.address) {
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county ||
          data.address.state ||
          "";
        const country = data.address.country || "";
        const name = [city, country].filter(Boolean).join(", ");
        if (name) return name;
      }
    } catch {
      // ignore, fall back to coords
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }, []);

  // Get geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setIsLoadingLocation(false);
      setShowLocationPrompt(false);
      toast.error("Геолокация не поддерживается вашим браузером");
      return;
    }
    setIsLoadingLocation(true);
    setLocationError(false);
    setShowLocationPrompt(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        const name = await reverseGeocode(lat, lng);
        setLocationName(name);
        setIsLoadingLocation(false);
        setShowLocationPrompt(false);
        localStorageApplied.current = true;
        saveStoredLocation(lat, lng, name);
      },
      (err) => {
        setLocationError(true);
        setIsLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Доступ к геолокации запрещён. Разрешите доступ в настройках браузера или введите город вручную.",
          );
        } else if (err.code === err.TIMEOUT) {
          toast.error("Время ожидания геолокации истекло. Попробуйте ещё раз.");
        } else {
          toast.error(
            "Не удалось определить местоположение. Введите город вручную.",
          );
        }
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  }, [reverseGeocode]);

  const handleCitySearch = useCallback(async () => {
    const query = citySearch.trim();
    if (!query) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "Accept-Language": "ru" } },
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        toast.error("Город или страна не найдены");
        return;
      }
      const result = data[0];
      const parts = (result.display_name as string).split(",").slice(0, 2);
      const lat = Number.parseFloat(result.lat);
      const lng = Number.parseFloat(result.lon);
      const name = parts.join(",").trim();
      setCoords({ lat, lng });
      setLocationName(name);
      setLocationError(false);
      setIsLoadingLocation(false);
      setShowLocationPrompt(false);
      localStorageApplied.current = true;
      setCitySearch("");
      saveStoredLocation(lat, lng, name);
    } catch {
      toast.error("Ошибка поиска. Проверьте интернет-соединение");
    } finally {
      setIsSearching(false);
    }
  }, [citySearch]);

  // Compute prayer times
  useEffect(() => {
    if (!coords) return;
    const coordinates = new Coordinates(coords.lat, coords.lng);
    const params = getCalculationParams(calcMethod);
    params.madhab = madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
    const today = new Date();
    const times = new PrayerTimes(coordinates, today, params);
    setPrayerTimes(times);
  }, [coords, calcMethod, madhab]);

  const handleSaveSettings = () => {
    if (!isLoggedIn) {
      toast.error("Войдите для сохранения настроек");
      return;
    }
    if (!coords) return;
    const settings: PrayerSettings = {
      latitude: coords.lat,
      longitude: coords.lng,
      locationName,
      calculationMethod: calcMethod,
      madhab,
      notificationsEnabled: false,
    };
    saveSettings(settings, {
      onSuccess: () => toast.success("Настройки сохранены"),
      onError: () => toast.error("Ошибка сохранения"),
    });
    setSettingsOpen(false);
  };

  const prayers: PrayerInfo[] = prayerTimes
    ? [
        {
          name: "Fajr",
          nameArabic: "الفجر",
          nameRu: tr("prayer.fajr", lang),
          time: prayerTimes.fajr,
          key: "fajr",
        },
        {
          name: "Sunrise",
          nameArabic: "الشروق",
          nameRu: tr("prayer.sunrise", lang),
          time: prayerTimes.sunrise,
          key: "sunrise",
        },
        {
          name: "Dhuhr",
          nameArabic: "الظهر",
          nameRu: tr("prayer.dhuhr", lang),
          time: prayerTimes.dhuhr,
          key: "dhuhr",
        },
        {
          name: "Asr",
          nameArabic: "العصر",
          nameRu: tr("prayer.asr", lang),
          time: prayerTimes.asr,
          key: "asr",
        },
        {
          name: "Maghrib",
          nameArabic: "المغرب",
          nameRu: tr("prayer.maghrib", lang),
          time: prayerTimes.maghrib,
          key: "maghrib",
        },
        {
          name: "Isha",
          nameArabic: "العشاء",
          nameRu: tr("prayer.isha", lang),
          time: prayerTimes.isha,
          key: "isha",
        },
      ]
    : [];

  // Find current/next prayer
  const getActivePrayer = (): {
    current: PrayerInfo | null;
    next: PrayerInfo | null;
    nextTime: Date | null;
  } => {
    if (!prayers.length) return { current: null, next: null, nextTime: null };
    const fivePrayers = prayers.filter((p) => p.key !== "sunrise");
    let currentPrayer: PrayerInfo | null = null;
    let nextPrayer: PrayerInfo | null = null;

    for (let i = 0; i < fivePrayers.length; i++) {
      const p = fivePrayers[i];
      const nextP = fivePrayers[i + 1];
      if (p.time && now >= p.time) {
        if (!nextP || !nextP.time || now < nextP.time) {
          currentPrayer = p;
          nextPrayer = nextP ?? fivePrayers[0] ?? null;
        }
      }
    }
    if (!currentPrayer && fivePrayers[0]?.time && now < fivePrayers[0].time) {
      nextPrayer = fivePrayers[0] ?? null;
    }

    const nextTime = nextPrayer?.time ?? null;
    return { current: currentPrayer, next: nextPrayer, nextTime };
  };

  const { current, next, nextTime } = getActivePrayer();
  const countdown = nextTime ? nextTime.getTime() - now.getTime() : 0;

  const handleTogglePrayer = (key: string) => {
    // Only allow marking actual prayers (not sunrise)
    if (key === "sunrise") return;
    setPrayersDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Decrement total when unmarking
        const total = Math.max(
          0,
          Number(localStorage.getItem("prayers_checked") || "0") - 1,
        );
        localStorage.setItem("prayers_checked", String(total));
        try {
          localStorage.setItem(
            PRAYER_TRACK_KEY,
            JSON.stringify({ date: getTodayKey(), keys: Array.from(next) }),
          );
        } catch {
          /* ignore */
        }
      } else {
        next.add(key);
        savePrayersDone(next);
        playPrayerCheck();
        const prayerName = tr(`prayer.${key}`, lang);
        toast.success(`${prayerName} совершён! 🤲`);
      }
      return next;
    });
  };

  const todayHijri = toHijri(now);

  // PrayerIcon component defined inline to keep file self-contained
  const PrayerIcon = ({ type }: { type: string }) => {
    const icons: Record<string, React.ReactNode> = {
      fajr: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Фаджр"
          role="img"
        >
          <title>Фаджр</title>
          <defs>
            <radialGradient id="fajr-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1060" />
              <stop offset="100%" stopColor="#0a0520" />
            </radialGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#fajr-bg)" />
          {/* Stars */}
          <circle cx="7" cy="7" r="0.8" fill="#e2c97e" opacity="0.9" />
          <circle cx="14" cy="5" r="0.6" fill="#e2c97e" opacity="0.7" />
          <circle cx="25" cy="9" r="0.9" fill="#d4b8f0" opacity="0.8" />
          <circle cx="28" cy="5" r="0.5" fill="#e2c97e" opacity="0.6" />
          <circle cx="5" cy="13" r="0.5" fill="#d4b8f0" opacity="0.5" />
          <circle cx="22" cy="4" r="0.7" fill="#e2c97e" opacity="0.7" />
          {/* Crescent moon */}
          <path
            d="M20 16 A7 7 0 1 1 13 9 A5 5 0 1 0 20 16 Z"
            fill="#f5d97a"
            opacity="0.95"
          />
        </svg>
      ),
      sunrise: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Восход"
          role="img"
        >
          <title>Восход</title>
          <defs>
            <linearGradient id="sunrise-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2a5e" />
              <stop offset="60%" stopColor="#c45c1a" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <radialGradient id="sunrise-sun" cx="50%" cy="80%" r="50%">
              <stop offset="0%" stopColor="#fef3a0" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#sunrise-bg)" />
          {/* Horizon glow */}
          <ellipse
            cx="16"
            cy="24"
            rx="14"
            ry="5"
            fill="#f97316"
            opacity="0.35"
          />
          {/* Sun arc rising */}
          <path
            d="M6 24 Q16 10 26 24"
            stroke="#fbbf24"
            strokeWidth="0.6"
            fill="none"
            opacity="0.4"
          />
          {/* Sun half-circle at horizon */}
          <path d="M10 24 A6 6 0 0 1 22 24 Z" fill="#fef3a0" />
          <ellipse cx="16" cy="24" rx="6" ry="2" fill="#fef3a0" />
          {/* Rays */}
          <line
            x1="16"
            y1="14"
            x2="16"
            y2="11"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
          <line
            x1="11"
            y1="16"
            x2="9"
            y2="14"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="21"
            y1="16"
            x2="23"
            y2="14"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="9"
            y1="21"
            x2="7"
            y2="20"
            stroke="#fbbf24"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.4"
          />
          <line
            x1="23"
            y1="21"
            x2="25"
            y2="20"
            stroke="#fbbf24"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Horizon line */}
          <line
            x1="3"
            y1="24"
            x2="29"
            y2="24"
            stroke="#f97316"
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>
      ),
      dhuhr: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Зухр"
          role="img"
        >
          <title>Зухр</title>
          <defs>
            <radialGradient id="dhuhr-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a3a5c" />
              <stop offset="100%" stopColor="#0d1f3a" />
            </radialGradient>
            <radialGradient id="dhuhr-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff7c0" />
              <stop offset="45%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#fb923c" />
            </radialGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#dhuhr-bg)" />
          {/* Outer glow halo */}
          <circle cx="16" cy="16" r="11" fill="#f97316" opacity="0.12" />
          <circle cx="16" cy="16" r="8.5" fill="#fbbf24" opacity="0.18" />
          {/* Sun body */}
          <circle cx="16" cy="16" r="6" fill="url(#dhuhr-sun)" />
          {/* Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 16 + 7.5 * Math.cos(rad);
            const y1 = 16 + 7.5 * Math.sin(rad);
            const x2 = 16 + 10 * Math.cos(rad);
            const y2 = 16 + 10 * Math.sin(rad);
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#fde047"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.85"
              />
            );
          })}
        </svg>
      ),
      asr: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Аср"
          role="img"
        >
          <title>Аср</title>
          <defs>
            <linearGradient id="asr-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a3a5c" />
              <stop offset="100%" stopColor="#0f2840" />
            </linearGradient>
            <radialGradient id="asr-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#fb923c" />
            </radialGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#asr-bg)" />
          {/* Sun — slightly low in sky */}
          <circle cx="20" cy="14" r="5" fill="url(#asr-sun)" opacity="0.9" />
          {/* Rays */}
          <line
            x1="20"
            y1="7"
            x2="20"
            y2="5"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <line
            x1="26"
            y1="14"
            x2="28"
            y2="14"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="24"
            y1="9"
            x2="25.5"
            y2="7.5"
            stroke="#fbbf24"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Cloud */}
          <ellipse cx="13" cy="21" rx="7" ry="4" fill="white" opacity="0.15" />
          <ellipse
            cx="10"
            cy="20"
            rx="5"
            ry="3.5"
            fill="white"
            opacity="0.18"
          />
          <ellipse
            cx="16"
            cy="21"
            rx="6"
            ry="3.2"
            fill="white"
            opacity="0.20"
          />
          <ellipse cx="12" cy="19" rx="4" ry="3" fill="white" opacity="0.25" />
          {/* Sun partially behind cloud */}
          <ellipse
            cx="18"
            cy="20"
            rx="3"
            ry="2"
            fill="#fb923c"
            opacity="0.25"
          />
        </svg>
      ),
      maghrib: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Магриб"
          role="img"
        >
          <title>Магриб</title>
          <defs>
            <linearGradient id="maghrib-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a0a3e" />
              <stop offset="45%" stopColor="#7b2d8b" />
              <stop offset="75%" stopColor="#c0522a" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#maghrib-sky)" />
          {/* Horizon glow */}
          <ellipse
            cx="16"
            cy="26"
            rx="15"
            ry="4"
            fill="#f97316"
            opacity="0.4"
          />
          {/* Sun at horizon */}
          <ellipse
            cx="16"
            cy="26"
            rx="5"
            ry="2.5"
            fill="#fde047"
            opacity="0.9"
          />
          {/* Silhouette city skyline */}
          <rect x="3" y="20" width="3" height="8" rx="0.5" fill="#0a0520" />
          <rect x="5" y="17" width="2" height="11" rx="0.5" fill="#0a0520" />
          <rect x="8" y="19" width="4" height="9" rx="0.5" fill="#0a0520" />
          <rect x="11" y="15" width="2" height="13" rx="0.5" fill="#0a0520" />
          <rect
            x="12.5"
            y="13"
            width="1.5"
            height="15"
            rx="0.5"
            fill="#0a0520"
          />
          {/* Dome (mosque) */}
          <rect x="14" y="18" width="4" height="10" rx="0" fill="#0a0520" />
          <path d="M14 18 Q16 14 18 18 Z" fill="#0a0520" />
          {/* Minaret */}
          <rect
            x="17.5"
            y="11"
            width="1.5"
            height="17"
            rx="0.3"
            fill="#0a0520"
          />
          <ellipse cx="18.25" cy="11" rx="1" ry="0.7" fill="#0a0520" />
          {/* More buildings */}
          <rect x="20" y="20" width="3" height="8" rx="0.5" fill="#0a0520" />
          <rect x="22" y="17" width="2" height="11" rx="0.5" fill="#0a0520" />
          <rect x="25" y="19" width="3" height="9" rx="0.5" fill="#0a0520" />
          <rect x="27" y="21" width="3" height="7" rx="0.5" fill="#0a0520" />
          {/* Stars */}
          <circle cx="8" cy="8" r="0.7" fill="#e2d8ff" opacity="0.8" />
          <circle cx="23" cy="6" r="0.9" fill="#e2d8ff" opacity="0.7" />
          <circle cx="28" cy="11" r="0.6" fill="#e2d8ff" opacity="0.6" />
        </svg>
      ),
      isha: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Иша"
          role="img"
        >
          <title>Иша</title>
          <defs>
            <radialGradient id="isha-bg" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0d1a4a" />
              <stop offset="100%" stopColor="#060a1e" />
            </radialGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#isha-bg)" />
          {/* Stars scattered */}
          <circle cx="5" cy="6" r="0.7" fill="#d4c8ff" opacity="0.8" />
          <circle cx="11" cy="4" r="0.5" fill="#e2d8ff" opacity="0.7" />
          <circle cx="27" cy="7" r="0.8" fill="#d4c8ff" opacity="0.9" />
          <circle cx="24" cy="13" r="0.5" fill="#e2d8ff" opacity="0.6" />
          <circle cx="7" cy="16" r="0.6" fill="#d4c8ff" opacity="0.5" />
          <circle cx="29" cy="20" r="0.5" fill="#e2d8ff" opacity="0.5" />
          <circle cx="4" cy="24" r="0.6" fill="#d4c8ff" opacity="0.4" />
          <circle cx="20" cy="27" r="0.5" fill="#e2d8ff" opacity="0.4" />
          {/* Crescent moon */}
          <path
            d="M18 10 A6 6 0 1 1 12 17 A4.2 4.2 0 1 0 18 10 Z"
            fill="#c8b8ff"
            opacity="0.9"
          />
          {/* Shooting star */}
          <line
            x1="24"
            y1="22"
            x2="15"
            y2="29"
            stroke="#fde047"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="24" cy="22" r="1.2" fill="#fde047" opacity="0.9" />
          <line
            x1="24"
            y1="22"
            x2="28"
            y2="18"
            stroke="#fde047"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      ),
    };
    return (
      <span
        className="shrink-0 inline-flex items-center justify-center"
        style={{ width: 32, height: 32 }}
      >
        {icons[type] ?? <span className="text-xl">🕌</span>}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Date Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="glass-card rounded-2xl p-4 text-center space-y-1">
          <div className="text-islamic-400 text-sm font-medium tracking-widest uppercase">
            {formatHijriRu(todayHijri)}
          </div>
          <div className="text-foreground/60 text-xs">
            {formatGregorianRu(now)}
          </div>
        </div>
      </div>

      {/* Location Card */}
      <div className="px-4 mb-3">
        <div className="glass-card rounded-2xl p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={13} className="text-islamic-500 shrink-0" />
              <span className="text-foreground/70 text-xs font-medium uppercase tracking-wider">
                Местоположение
              </span>
            </div>
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-islamic-400 hover:text-islamic-300"
                  data-ocid="prayer.settings.open_modal_button"
                >
                  <Settings size={14} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="bg-card border-islamic-500/20 rounded-t-2xl"
                data-ocid="prayer.settings.dialog"
              >
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-foreground font-display">
                    Настройки намаза
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground/70">Метод расчёта</Label>
                    <Select value={calcMethod} onValueChange={setCalcMethod}>
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {CALCULATION_METHODS.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            className="text-foreground"
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground/70">
                      Мазхаб (для времени Аср)
                    </Label>
                    <Select value={madhab} onValueChange={setMadhab}>
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {MADHABS.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            className="text-foreground"
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter className="pt-4">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-islamic-400"
                    onClick={handleSaveSettings}
                  >
                    {isLoggedIn
                      ? "Сохранить настройки"
                      : "Применить (без сохранения)"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Current location name */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${locationError ? "bg-red-500/5 border-red-500/30" : "bg-white/5 border-white/10"}`}
          >
            <MapPin
              size={12}
              className={`shrink-0 ${locationError ? "text-red-400" : "text-islamic-400"}`}
            />
            <span className="text-foreground/80 text-xs truncate flex-1">
              {isLoadingLocation ? (
                <span className="text-foreground/40 italic">
                  Определение местоположения...
                </span>
              ) : locationError ? (
                <span className="text-red-400">
                  Геолокация недоступна — разрешите доступ или введите город
                </span>
              ) : (
                locationName
              )}
            </span>
          </div>

          {/* Two action rows */}
          <div className="space-y-2">
            {/* Geolocation button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs border-islamic-500/30 bg-islamic-500/5 text-islamic-300 hover:bg-islamic-500/15 hover:text-islamic-200 hover:border-islamic-500/50 gap-2"
              onClick={requestLocation}
              disabled={isLoadingLocation}
              data-ocid="prayer.location.button"
            >
              {isLoadingLocation ? (
                <span className="w-3.5 h-3.5 border-2 border-islamic-400/40 border-t-islamic-400 rounded-full animate-spin" />
              ) : (
                <Locate size={13} />
              )}
              По геолокации
            </Button>

            {/* City / country search */}
            <div className="flex gap-2">
              <Input
                placeholder="Поиск города или страны..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
                className="bg-secondary border-border text-foreground text-xs h-9 flex-1 placeholder:text-foreground/30"
                data-ocid="prayer.location.search_input"
              />
              <Button
                size="sm"
                className="h-9 px-3 bg-primary text-primary-foreground hover:bg-islamic-400 shrink-0"
                onClick={handleCitySearch}
                disabled={isSearching || !citySearch.trim()}
                data-ocid="prayer.location.submit_button"
              >
                {isSearching ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Search size={13} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Next Prayer Countdown */}
      {!isLoadingLocation && prayerTimes && next && (
        <div className="px-4 mb-4">
          <div className="glass-card rounded-2xl p-4 text-center border border-islamic-500/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-islamic-500/5 to-transparent" />
            <div className="relative">
              <div className="text-xs text-foreground/50 uppercase tracking-widest mb-1">
                {current ? "Текущий намаз" : "Следующий намаз"}
              </div>
              <div className="text-2xl font-display font-bold text-islamic-400 mb-1">
                {next.nameRu}
              </div>
              <div className="text-foreground/50 text-sm arabic-text mb-3">
                {next.nameArabic}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock size={14} className="text-islamic-500" />
                <span className="font-mono text-3xl font-bold text-foreground tracking-wider">
                  {formatCountdown(countdown)}
                </span>
              </div>
              <div className="text-foreground/40 text-xs mt-1">
                до следующего намаза
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Permission Prompt */}
      {showLocationPrompt && !isLoadingLocation && !coords && (
        <div className="px-4 mb-4">
          <div className="glass-card rounded-2xl p-6 text-center space-y-4 border border-islamic-500/20">
            <div className="flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-islamic-500/15 border border-islamic-500/30 flex items-center justify-center">
                <MapPin size={26} className="text-islamic-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-foreground font-semibold text-base">
                Определить местоположение
              </div>
              <div className="text-foreground/50 text-xs leading-relaxed">
                Разрешите доступ к геолокации, чтобы рассчитать точное время
                намаза для вашего города
              </div>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-islamic-400 gap-2 h-10"
              onClick={requestLocation}
              data-ocid="prayer.geolocation.primary_button"
            >
              <Locate size={15} />
              Разрешить геолокацию
            </Button>
            <div className="text-foreground/30 text-[11px]">
              Или введите город вручную ниже
            </div>
          </div>
        </div>
      )}

      {/* Prayer List */}
      <div className="px-4 space-y-2 pb-4 stagger-children">
        {isLoadingLocation
          ? ["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
              <Skeleton key={k} className="h-16 rounded-xl bg-secondary" />
            ))
          : prayers.map((prayer) => {
              const isNext =
                next?.key === prayer.key && !prayersDone.has(prayer.key);
              const isCurrent = current?.key === prayer.key;
              const isPast = prayer.time ? prayer.time < now : false;
              const isSunrise = prayer.key === "sunrise";
              const isDone = prayersDone.has(prayer.key);

              return (
                <div
                  key={prayer.key}
                  className={`glass-card rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-300 ${
                    isNext && !isSunrise
                      ? "bg-islamic-500/10 border border-islamic-500/35"
                      : isDone
                        ? "border-green-500/30"
                        : isCurrent && !isSunrise
                          ? "border-white/10"
                          : ""
                  } ${isPast && !isCurrent && !isNext && !isDone ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <PrayerIcon type={prayer.key} />
                    <div>
                      <div
                        className={`font-semibold text-sm ${
                          isDone
                            ? "text-green-400"
                            : isNext && !isSunrise
                              ? "text-islamic-400 font-bold"
                              : "text-foreground"
                        }`}
                      >
                        {prayer.nameRu}
                        {isDone && (
                          <span className="ml-1 text-xs font-normal text-green-400/70">
                            совершён
                          </span>
                        )}
                      </div>
                      <div
                        className="text-foreground/40 text-xs"
                        style={{ fontFamily: "serif", direction: "rtl" }}
                      >
                        {prayer.nameArabic}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`font-mono text-lg font-bold ${
                        isDone
                          ? "text-green-400"
                          : isNext && !isSunrise
                            ? "text-islamic-400 font-bold"
                            : "text-foreground/80"
                      }`}
                    >
                      {formatTime(prayer.time)}
                      {isNext && !isSunrise && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-islamic-500 animate-pulse" />
                      )}
                    </div>
                    {/* Checkbox — only for the 5 prayers */}
                    {!isSunrise && (
                      <button
                        type="button"
                        onClick={() => handleTogglePrayer(prayer.key)}
                        className="transition-all duration-200 hover:scale-110 active:scale-95"
                        title={
                          isDone
                            ? "Отметить как не совершённый"
                            : "Отметить как совершённый"
                        }
                        data-ocid={`prayer.done.${prayer.key}.toggle`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={22} className="text-green-400" />
                        ) : (
                          <Circle
                            size={22}
                            className="text-foreground/20 hover:text-islamic-400/60"
                          />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Expand for more info */}
      {!isLoadingLocation && prayerTimes && (
        <div className="px-4 pb-4 text-center">
          <div className="text-foreground/30 text-xs flex items-center justify-center gap-1">
            <ChevronDown size={12} />
            Метод:{" "}
            {CALCULATION_METHODS.find((m) => m.value === calcMethod)?.label}
          </div>
        </div>
      )}
    </div>
  );
}
