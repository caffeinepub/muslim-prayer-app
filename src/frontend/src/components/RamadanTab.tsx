import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
} from "adhan";
import { Clock, Locate, MapPin, Moon, Search, Star, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

// Approximate current Ramadan day (2026: Ramadan starts around Feb 17, 2026)
function getRamadanDay(): { day: number | null; year: number } {
  const now = new Date();
  // Ramadan 1447 AH ~ Feb 17 – Mar 18, 2026
  const ramadanStart2026 = new Date("2026-02-17");
  const ramadanEnd2026 = new Date("2026-03-18");
  if (now >= ramadanStart2026 && now <= ramadanEnd2026) {
    const diff = Math.floor(
      (now.getTime() - ramadanStart2026.getTime()) / (1000 * 60 * 60 * 24),
    );
    return { day: diff + 1, year: 1447 };
  }
  return { day: null, year: 1447 };
}

const RAMADAN_DUAS = [
  {
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Аллахумма иннака 'афуввун тухиббуль 'афва фа'фу 'анни",
    ru: "О Аллах, поистине Ты Прощающий, любишь прощение, так прости же меня",
    occasion: "Ночь предопределения (Лайлятуль-Кадр)",
  },
  {
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Аллахумма барик лана фима разактана ва кина 'азабан-нар",
    ru: "О Аллах, благослови нам то, чем Ты нас наделил, и убереги нас от мучений огня",
    occasion: "Дуа после ифтара",
  },
];

export default function RamadanTab() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationName, setLocationName] = useState(
    "Определение местоположения...",
  );
  const [locationError, setLocationError] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [now, setNow] = useState(new Date());
  const [citySearch, setCitySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const hasTriedAuto = useRef(false);

  // Tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
      // ignore
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setIsLoadingLocation(false);
      toast.error("Геолокация не поддерживается");
      return;
    }
    setIsLoadingLocation(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        const name = await reverseGeocode(lat, lng);
        setLocationName(name);
        setIsLoadingLocation(false);
      },
      (err) => {
        setLocationError(true);
        setIsLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Доступ к геолокации запрещён. Введите город вручную.");
        } else {
          toast.error("Не удалось определить местоположение.");
        }
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (!hasTriedAuto.current) {
      hasTriedAuto.current = true;
      requestLocation();
    }
  }, [requestLocation]);

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
        toast.error("Город не найден");
        return;
      }
      const result = data[0];
      const parts = (result.display_name as string).split(",").slice(0, 2);
      setCoords({
        lat: Number.parseFloat(result.lat),
        lng: Number.parseFloat(result.lon),
      });
      setLocationName(parts.join(",").trim());
      setLocationError(false);
      setIsLoadingLocation(false);
      setCitySearch("");
    } catch {
      toast.error("Ошибка поиска");
    } finally {
      setIsSearching(false);
    }
  }, [citySearch]);

  // Compute prayer times
  useEffect(() => {
    if (!coords) return;
    const coordinates = new Coordinates(coords.lat, coords.lng);
    const params = CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Shafi;
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
    const times = new PrayerTimes(coordinates, new Date(), params);
    setPrayerTimes(times);
  }, [coords]);

  const suhoor = prayerTimes?.fajr ?? null;
  const iftar = prayerTimes?.maghrib ?? null;

  // Find next event
  const getNextEvent = (): {
    name: string;
    time: Date | null;
    isSuhoor: boolean;
  } => {
    if (!suhoor || !iftar)
      return { name: "Ифтар", time: null, isSuhoor: false };
    if (now < suhoor)
      return { name: "Сухур (конец)", time: suhoor, isSuhoor: true };
    if (now < iftar) return { name: "Ифтар", time: iftar, isSuhoor: false };
    // After iftar — next suhoor is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const coords2 = coords;
    if (coords2) {
      const coordinates = new Coordinates(coords2.lat, coords2.lng);
      const params = CalculationMethod.MuslimWorldLeague();
      params.madhab = Madhab.Shafi;
      params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
      const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
      return {
        name: "Сухур завтра (конец)",
        time: tomorrowTimes.fajr,
        isSuhoor: true,
      };
    }
    return { name: "Ифтар", time: null, isSuhoor: false };
  };

  const nextEvent = getNextEvent();
  const countdown = nextEvent.time
    ? nextEvent.time.getTime() - now.getTime()
    : 0;
  const ramadanInfo = getRamadanDay();

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Moon size={16} className="text-orange-500" />
          <h2 className="text-xl font-display font-bold text-gradient-orange">
            Рамадан
          </h2>
          <Moon size={16} className="text-orange-500" />
        </div>
        <p className="text-foreground/40 text-xs">
          {ramadanInfo.day
            ? `День ${ramadanInfo.day} Рамадана ${ramadanInfo.year} г.х.`
            : `Рамадан ${ramadanInfo.year} г.х.`}
        </p>
        <div
          className="text-xl mt-2 text-foreground/20"
          style={{ fontFamily: "serif", direction: "rtl" }}
        >
          رَمَضَانُ شَهْرٌ مُبَارَكٌ
        </div>
      </div>

      {/* Location */}
      <div className="glass-card rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-orange-500 shrink-0" />
          <span className="text-foreground/70 text-xs font-medium uppercase tracking-wider">
            Местоположение
          </span>
        </div>
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
                Разрешите доступ или введите город
              </span>
            ) : (
              locationName
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs border-orange-500/30 bg-orange-500/5 text-orange-300 hover:bg-orange-500/15 gap-2"
          onClick={requestLocation}
          disabled={isLoadingLocation}
          data-ocid="ramadan.location.button"
        >
          {isLoadingLocation ? (
            <span className="w-3.5 h-3.5 border-2 border-orange-400/40 border-t-orange-400 rounded-full animate-spin" />
          ) : (
            <Locate size={13} />
          )}
          По геолокации
        </Button>
        <div className="flex gap-2">
          <Input
            placeholder="Поиск города..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
            className="bg-secondary border-border text-foreground text-xs h-9 flex-1 placeholder:text-foreground/30"
            data-ocid="ramadan.location.search_input"
          />
          <Button
            size="sm"
            className="h-9 px-3 bg-primary text-primary-foreground hover:bg-orange-400 shrink-0"
            onClick={handleCitySearch}
            disabled={isSearching || !citySearch.trim()}
            data-ocid="ramadan.location.submit_button"
          >
            {isSearching ? (
              <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Search size={13} />
            )}
          </Button>
        </div>
      </div>

      {/* Countdown to next event */}
      {!isLoadingLocation && prayerTimes && (
        <div className="glass-card rounded-2xl p-4 mb-4 text-center border border-orange-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
          <div className="relative">
            <div className="text-xs text-foreground/50 uppercase tracking-widest mb-1">
              До события
            </div>
            <div className="text-xl font-display font-bold text-orange-400 mb-1">
              {nextEvent.name}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Clock size={14} className="text-orange-500" />
              <span className="font-mono text-3xl font-bold text-foreground tracking-wider">
                {formatCountdown(countdown)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Suhoor & Iftar times */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Suhoor */}
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Star size={14} className="text-orange-400" />
            <span className="text-xs text-foreground/50 uppercase tracking-wider">
              Сухур
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-foreground mb-1">
            {isLoadingLocation ? (
              <span className="text-foreground/30 text-lg">--:--</span>
            ) : (
              formatTime(suhoor)
            )}
          </div>
          <div
            className="text-foreground/30 text-xs"
            style={{ fontFamily: "serif", direction: "rtl" }}
          >
            السحور
          </div>
          <div className="text-foreground/40 text-[10px] mt-1">до Фаджра</div>
        </div>

        {/* Iftar */}
        <div className="glass-card rounded-2xl p-4 text-center border border-orange-500/20">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Sun size={14} className="text-orange-400" />
            <span className="text-xs text-foreground/50 uppercase tracking-wider">
              Ифтар
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-orange-400 mb-1">
            {isLoadingLocation ? (
              <span className="text-foreground/30 text-lg">--:--</span>
            ) : (
              formatTime(iftar)
            )}
          </div>
          <div
            className="text-foreground/30 text-xs"
            style={{ fontFamily: "serif", direction: "rtl" }}
          >
            الإفطار
          </div>
          <div className="text-foreground/40 text-[10px] mt-1">на Магрибе</div>
        </div>
      </div>

      {/* All prayer times in Ramadan */}
      {!isLoadingLocation && prayerTimes && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <div className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-medium">
            Все времена
          </div>
          <div className="space-y-2">
            {[
              {
                key: "fajr",
                nameRu: "Фаджр (Сухур)",
                nameAr: "الفجر",
                time: prayerTimes.fajr,
                highlight: true,
              },
              {
                key: "sunrise",
                nameRu: "Восход",
                nameAr: "الشروق",
                time: prayerTimes.sunrise,
                highlight: false,
              },
              {
                key: "dhuhr",
                nameRu: "Зухр",
                nameAr: "الظهر",
                time: prayerTimes.dhuhr,
                highlight: false,
              },
              {
                key: "asr",
                nameRu: "Аср",
                nameAr: "العصر",
                time: prayerTimes.asr,
                highlight: false,
              },
              {
                key: "maghrib",
                nameRu: "Магриб (Ифтар)",
                nameAr: "المغرب",
                time: prayerTimes.maghrib,
                highlight: true,
              },
              {
                key: "isha",
                nameRu: "Иша (Таравих)",
                nameAr: "العشاء",
                time: prayerTimes.isha,
                highlight: false,
              },
            ].map((p) => (
              <div
                key={p.key}
                className={`flex items-center justify-between py-2 px-3 rounded-xl ${p.highlight ? "bg-orange-500/10 border border-orange-500/20" : "bg-white/3"}`}
              >
                <div>
                  <div
                    className={`text-sm font-medium ${p.highlight ? "text-orange-400" : "text-foreground/80"}`}
                  >
                    {p.nameRu}
                  </div>
                  <div
                    className="text-foreground/30 text-xs"
                    style={{ fontFamily: "serif", direction: "rtl" }}
                  >
                    {p.nameAr}
                  </div>
                </div>
                <div
                  className={`font-mono text-lg font-bold ${p.highlight ? "text-orange-400" : "text-foreground/70"}`}
                >
                  {formatTime(p.time)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ramadan duas */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-medium">
          Дуа Рамадана
        </div>
        <div className="space-y-4">
          {RAMADAN_DUAS.map((dua) => (
            <div key={dua.occasion} className="space-y-2">
              <div className="text-[10px] text-orange-400/60 uppercase tracking-wider">
                {dua.occasion}
              </div>
              <div
                className="text-right text-foreground/80 text-lg leading-relaxed"
                style={{ fontFamily: "serif", direction: "rtl" }}
              >
                {dua.arabic}
              </div>
              <div className="text-foreground/40 text-xs italic">
                {dua.transliteration}
              </div>
              <div className="text-foreground/60 text-xs leading-relaxed">
                {dua.ru}
              </div>
              {dua !== RAMADAN_DUAS[RAMADAN_DUAS.length - 1] && (
                <div className="border-t border-orange-500/10 mt-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ramadan tips */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-medium">
          Напоминания
        </div>
        <ul className="space-y-2 text-foreground/60 text-sm">
          <li className="flex gap-2">
            <span className="text-orange-500">•</span>Сухур желательно совершать
            ближе к Фаджру
          </li>
          <li className="flex gap-2">
            <span className="text-orange-500">•</span>Ифтар начинайте с фиников
            и воды
          </li>
          <li className="flex gap-2">
            <span className="text-orange-500">•</span>Таравих — 20 ракятов после
            Иша
          </li>
          <li className="flex gap-2">
            <span className="text-orange-500">•</span>Ищи Лайлятуль-Кадр в
            последние 10 ночей
          </li>
          <li className="flex gap-2">
            <span className="text-orange-500">•</span>Умножай Коран, садаку и
            дуа
          </li>
        </ul>
      </div>
    </div>
  );
}
