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
  ChevronDown,
  Clock,
  Locate,
  MapPin,
  Search,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PrayerSettings } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetPrayerSettings,
  useSavePrayerSettings,
} from "../hooks/useQueries";
import { formatGregorianRu, formatHijriRu, toHijri } from "../utils/hijriDate";

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

export default function PrayerTimesTab() {
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

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: savedSettings } = useGetPrayerSettings();
  const { mutate: saveSettings } = useSavePrayerSettings();

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
          nameRu: "Фаджр",
          time: prayerTimes.fajr,
          key: "fajr",
        },
        {
          name: "Sunrise",
          nameArabic: "الشروق",
          nameRu: "Восход",
          time: prayerTimes.sunrise,
          key: "sunrise",
        },
        {
          name: "Dhuhr",
          nameArabic: "الظهر",
          nameRu: "Зухр",
          time: prayerTimes.dhuhr,
          key: "dhuhr",
        },
        {
          name: "Asr",
          nameArabic: "العصر",
          nameRu: "Аср",
          time: prayerTimes.asr,
          key: "asr",
        },
        {
          name: "Maghrib",
          nameArabic: "المغرب",
          nameRu: "Магриб",
          time: prayerTimes.maghrib,
          key: "maghrib",
        },
        {
          name: "Isha",
          nameArabic: "العشاء",
          nameRu: "Иша",
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

  const todayHijri = toHijri(now);

  const prayerIcons: Record<string, string> = {
    fajr: "🌙",
    sunrise: "🌅",
    dhuhr: "☀️",
    asr: "🌤️",
    maghrib: "🌆",
    isha: "🌠",
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Date Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="glass-card rounded-2xl p-4 text-center space-y-1">
          <div className="text-orange-400 text-sm font-medium tracking-widest uppercase">
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
              <MapPin size={13} className="text-orange-500 shrink-0" />
              <span className="text-foreground/70 text-xs font-medium uppercase tracking-wider">
                Местоположение
              </span>
            </div>
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-orange-400 hover:text-orange-300"
                  data-ocid="prayer.settings.open_modal_button"
                >
                  <Settings size={14} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="bg-card border-orange-500/20 rounded-t-2xl"
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
                    className="w-full bg-primary text-primary-foreground hover:bg-orange-400"
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
              className={`shrink-0 ${locationError ? "text-red-400" : "text-orange-400"}`}
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
              className="w-full h-9 text-xs border-orange-500/30 bg-orange-500/5 text-orange-300 hover:bg-orange-500/15 hover:text-orange-200 hover:border-orange-500/50 gap-2"
              onClick={requestLocation}
              disabled={isLoadingLocation}
              data-ocid="prayer.location.button"
            >
              {isLoadingLocation ? (
                <span className="w-3.5 h-3.5 border-2 border-orange-400/40 border-t-orange-400 rounded-full animate-spin" />
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
                className="h-9 px-3 bg-primary text-primary-foreground hover:bg-orange-400 shrink-0"
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
          <div className="glass-card rounded-2xl p-4 text-center border border-orange-500/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <div className="relative">
              <div className="text-xs text-foreground/50 uppercase tracking-widest mb-1">
                {current ? "Текущий намаз" : "Следующий намаз"}
              </div>
              <div className="text-2xl font-display font-bold text-orange-400 mb-1">
                {next.nameRu}
              </div>
              <div className="text-foreground/50 text-sm arabic-text mb-3">
                {next.nameArabic}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock size={14} className="text-orange-500" />
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
          <div className="glass-card rounded-2xl p-6 text-center space-y-4 border border-orange-500/20">
            <div className="flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                <MapPin size={26} className="text-orange-400" />
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
              className="w-full bg-primary text-primary-foreground hover:bg-orange-400 gap-2 h-10"
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
              const isActive =
                current?.key === prayer.key || next?.key === prayer.key;
              const isPast = prayer.time ? prayer.time < now : false;
              const isSunrise = prayer.key === "sunrise";

              return (
                <div
                  key={prayer.key}
                  className={`glass-card rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-300 ${
                    isActive && !isSunrise ? "prayer-active" : ""
                  } ${isPast && !isActive ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{prayerIcons[prayer.key]}</span>
                    <div>
                      <div
                        className={`font-semibold text-sm ${isActive && !isSunrise ? "text-orange-400" : "text-foreground"}`}
                      >
                        {prayer.nameRu}
                      </div>
                      <div
                        className="text-foreground/40 text-xs"
                        style={{ fontFamily: "serif", direction: "rtl" }}
                      >
                        {prayer.nameArabic}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-mono text-lg font-bold ${isActive && !isSunrise ? "text-orange-400" : "text-foreground/80"}`}
                  >
                    {formatTime(prayer.time)}
                    {isActive && !isSunrise && (
                      <span className="ml-2 inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
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
