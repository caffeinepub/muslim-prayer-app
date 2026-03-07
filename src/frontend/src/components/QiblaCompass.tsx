import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Coordinates, Qibla } from "adhan";
import {
  Compass,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MECCA_LAT = 21.3891;
const MECCA_LNG = 39.8576;

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readStoredLocationQibla(): {
  lat: number;
  lng: number;
  name?: string;
} | null {
  try {
    const stored = localStorage.getItem("prayer_location");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.lat && parsed.lng) return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Degree tick marks for the compass ring
function CompassRing({ diskRotation }: { diskRotation: number }) {
  const tickAngles = Array.from({ length: 72 }, (_, i) => i * 5);
  const ticks = tickAngles.map((i) => {
    const isMajor = i % 45 === 0;
    const isMinor = i % 15 === 0;
    const rad = (i * Math.PI) / 180;
    const r = 130;
    const len = isMajor ? 14 : isMinor ? 9 : 5;
    const x1 = r * Math.sin(rad);
    const y1 = -r * Math.cos(rad);
    const x2 = (r - len) * Math.sin(rad);
    const y2 = -(r - len) * Math.cos(rad);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={
          isMajor
            ? "rgba(249,115,22,0.7)"
            : isMinor
              ? "rgba(255,255,255,0.35)"
              : "rgba(255,255,255,0.18)"
        }
        strokeWidth={isMajor ? 2.5 : 1}
      />
    );
  });

  const cardinals = [
    { label: "С", angle: 0, color: "#f97316" },
    { label: "В", angle: 90, color: "rgba(255,255,255,0.75)" },
    { label: "Ю", angle: 180, color: "rgba(255,255,255,0.75)" },
    { label: "З", angle: 270, color: "rgba(255,255,255,0.75)" },
  ];

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        transform: `rotate(${diskRotation}deg)`,
        transition: "transform 0.25s ease-out",
      }}
    >
      <svg
        width="300"
        height="300"
        viewBox="-150 -150 300 300"
        aria-label="Кольцо компаса со сторонами света"
        role="img"
      >
        {/* Outer ring */}
        <circle
          cx="0"
          cy="0"
          r="138"
          fill="none"
          stroke="rgba(249,115,22,0.25)"
          strokeWidth="2"
        />
        <circle
          cx="0"
          cy="0"
          r="122"
          fill="none"
          stroke="rgba(249,115,22,0.08)"
          strokeWidth="1"
        />

        {/* Tick marks */}
        {ticks}

        {/* Cardinal letters */}
        {cardinals.map(({ label, angle, color }) => {
          const rad = (angle * Math.PI) / 180;
          const x = 108 * Math.sin(rad);
          const y = -108 * Math.cos(rad);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              fontSize="15"
              fontWeight="700"
              fontFamily="Outfit, sans-serif"
              letterSpacing="0.5"
            >
              {label}
            </text>
          );
        })}

        {/* Degree numbers at 0/45/90/... */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x = 92 * Math.sin(rad);
          const y = -92 * Math.cos(rad);
          if (deg % 90 === 0) return null; // covered by cardinal
          return (
            <text
              key={deg}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.3)"
              fontSize="9"
              fontFamily="Outfit, sans-serif"
            >
              {deg}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Qibla arrow — fixed, only arrowAngleDeg changes
function QiblaArrow({ arrowAngleDeg }: { arrowAngleDeg: number }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        transform: `rotate(${arrowAngleDeg}deg)`,
        transition: "transform 0.3s ease-out",
      }}
    >
      <svg
        width="300"
        height="300"
        viewBox="-150 -150 300 300"
        aria-label="Стрелка направления Киблы"
        role="img"
      >
        <defs>
          <filter id="arrow-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="arrowGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(249,115,22,0.4)" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        {/* Glow beam */}
        <line
          x1="0"
          y1="30"
          x2="0"
          y2="-115"
          stroke="rgba(249,115,22,0.12)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Arrow tail (counterweight) */}
        <polygon
          points="0,-18 -6,18 0,28 6,18"
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />

        {/* Arrow shaft */}
        <line
          x1="0"
          y1="18"
          x2="0"
          y2="-95"
          stroke="url(#arrowGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#arrow-glow)"
        />

        {/* Arrow head */}
        <polygon
          points="0,-118 -11,-90 0,-98 11,-90"
          fill="#f97316"
          filter="url(#arrow-glow)"
        />

        {/* Kaaba emoji at tip */}
        <text
          x="0"
          y="-126"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="16"
        >
          🕋
        </text>
      </svg>
    </div>
  );
}

export default function QiblaTab() {
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const headingRef = useRef<number | null>(null);

  const computeQibla = useCallback((lat: number, lng: number) => {
    const c = new Coordinates(lat, lng);
    const angle = Qibla(c);
    const dist = haversineDistance(lat, lng, MECCA_LAT, MECCA_LNG);
    setQiblaAngle(angle);
    setDistance(dist);
    return angle;
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setIsLoading(false);
      toast.error("Геолокация не поддерживается вашим браузером");
      return;
    }
    setIsLoading(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        computeQibla(lat, lng);
        setIsLoading(false);

        // Reverse geocoding
        let name = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "ru" } },
          );
          const data = await res.json();
          if (data?.address) {
            name =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county ||
              name;
            const country = data.address.country;
            if (country) name = `${name}, ${country}`;
          }
        } catch {
          /* ignore */
        }

        setLocationName(name);
        try {
          localStorage.setItem(
            "prayer_location",
            JSON.stringify({ lat, lng, name }),
          );
        } catch {
          /* ignore */
        }
        toast.success(`Местоположение: ${name}`);
      },
      (err) => {
        setLocationError(true);
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Доступ к геолокации запрещён. Введите город вручную.");
        } else {
          toast.error("Не удалось определить местоположение.");
        }
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  }, [computeQibla]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = readStoredLocationQibla();
    if (stored) {
      computeQibla(stored.lat, stored.lng);
      setLocationName(stored.name || null);
      setIsLoading(false);
    } else {
      requestLocation();
    }
  }, [computeQibla, requestLocation]);

  // Device orientation with correct heading calculation
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha === null) return;

      const webkitEvent = e as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
      };

      let heading: number;
      if (
        webkitEvent.webkitCompassHeading !== undefined &&
        webkitEvent.webkitCompassHeading !== null
      ) {
        // iOS Safari — already magnetic heading (0=N, clockwise)
        heading = webkitEvent.webkitCompassHeading;
      } else {
        // W3C standard alpha: 0=initial, counter-clockwise
        // Convert to clockwise compass heading
        heading = (360 - e.alpha) % 360;
      }

      setSensorAvailable(true);
      headingRef.current = heading;
      setDeviceHeading(heading);
    };

    if (typeof DeviceOrientationEvent !== "undefined") {
      // Request permission on iOS 13+
      type DOEWithPermission = typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      const DOE = DeviceOrientationEvent as DOEWithPermission;
      if (typeof DOE.requestPermission === "function") {
        DOE.requestPermission()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", handler, true);
            }
          })
          .catch(() => {
            window.addEventListener("deviceorientation", handler, true);
          });
      } else {
        window.addEventListener("deviceorientation", handler, true);
      }
    }

    return () => {
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, []);

  // Check alignment (phone pointing at Qibla ±5°)
  useEffect(() => {
    if (qiblaAngle === null || deviceHeading === null) {
      setIsAligned(false);
      return;
    }
    const diff = Math.abs(((qiblaAngle - deviceHeading + 540) % 360) - 180);
    setIsAligned(diff <= 5);
  }, [qiblaAngle, deviceHeading]);

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
      const lat = Number.parseFloat(result.lat);
      const lng = Number.parseFloat(result.lon);
      const parts = (result.display_name as string).split(",").slice(0, 2);
      const name = parts.join(", ").trim();
      computeQibla(lat, lng);
      setLocationName(name);
      setLocationError(false);
      setIsLoading(false);
      setCitySearch("");
      try {
        localStorage.setItem(
          "prayer_location",
          JSON.stringify({ lat, lng, name }),
        );
      } catch {
        /* ignore */
      }
      toast.success(`Направление для: ${name}`);
    } catch {
      toast.error("Ошибка поиска. Проверьте интернет-соединение");
    } finally {
      setIsSearching(false);
    }
  }, [citySearch, computeQibla]);

  // Correct compass rendering angles:
  // diskRotation: rotate the compass disk so that С always points to magnetic north
  //   disk rotates opposite to device heading → diskRotation = -deviceHeading
  // arrowAngleDeg: angle of the qibla arrow
  //   with sensor: qibla relative to screen top = qibla - deviceHeading
  //   without sensor: absolute angle from north
  const diskRotation =
    sensorAvailable && deviceHeading !== null ? -deviceHeading : 0;
  const arrowAngleDeg =
    sensorAvailable && deviceHeading !== null
      ? qiblaAngle !== null
        ? (qiblaAngle - deviceHeading + 720) % 360
        : 0
      : (qiblaAngle ?? 0);

  return (
    <div className="flex flex-col items-center px-4 py-4 pb-6">
      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-display font-bold text-gradient-orange mb-1">
          Направление Киблы
        </h2>
        <p className="text-foreground/50 text-sm">Сторона на Священную Мекку</p>

        {/* Location badge */}
        <AnimatePresence>
          {locationName && !isLoading && (
            <motion.div
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-islamic-500/10 border border-islamic-500/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <MapPin size={11} className="text-islamic-400" />
              <span className="text-xs text-islamic-300 font-medium">
                {locationName}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading skeleton */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-ocid="qibla.loading_state"
          >
            <Skeleton className="w-[300px] h-[300px] rounded-full bg-secondary" />
            <Skeleton className="w-40 h-5 rounded bg-secondary" />
            <Skeleton className="w-32 h-4 rounded bg-secondary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compass */}
      <AnimatePresence>
        {!isLoading && qiblaAngle !== null && (
          <motion.div
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {/* Compass container */}
            <div className="relative w-[300px] h-[300px] mb-6">
              {/* Pulse glow ring */}
              <div
                className={`absolute inset-4 rounded-full transition-all duration-500 ${
                  isAligned
                    ? "bg-green-500/20 shadow-[0_0_40px_12px_rgba(34,197,94,0.35)]"
                    : "bg-islamic-500/8 shadow-[0_0_30px_8px_rgba(249,115,22,0.18)]"
                }`}
                style={{ animation: "compassPulse 3s ease-in-out infinite" }}
              />

              {/* Glass inner circle */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, rgba(40,25,10,0.97) 0%, rgba(15,10,5,0.99) 70%)",
                    border: "1px solid rgba(249,115,22,0.15)",
                  }}
                />

                {/* Compass rotating disk */}
                <CompassRing diskRotation={diskRotation} />

                {/* Decorative inner circle */}
                <div
                  className="absolute rounded-full border border-islamic-500/10"
                  style={{
                    inset: "30px",
                    background: "rgba(0,0,0,0.2)",
                  }}
                />

                {/* Qibla arrow */}
                {qiblaAngle !== null && (
                  <QiblaArrow arrowAngleDeg={arrowAngleDeg} />
                )}

                {/* Center gem */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{
                        background: "radial-gradient(circle, #fbbf24, #f97316)",
                        boxShadow: "0 0 12px 3px rgba(249,115,22,0.6)",
                      }}
                    />
                    <div className="absolute inset-1.5 rounded-full bg-white/60" />
                  </div>
                </div>
              </div>

              {/* Alignment indicator */}
              <AnimatePresence>
                {isAligned && (
                  <motion.div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    data-ocid="qibla.aligned.success_state"
                  >
                    ✓ Направлено на Мекку
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* No sensor hint */}
            {!sensorAvailable && (
              <motion.p
                className="text-xs text-foreground/45 text-center mb-4 max-w-xs px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Направьте телефон на{" "}
                <span className="text-islamic-400 font-bold">С (север)</span> и
                следуйте по стрелке
              </motion.p>
            )}

            {/* Info cards */}
            <div className="w-full grid grid-cols-3 gap-2 mb-5">
              <div
                className="glass-card rounded-xl p-3 text-center"
                data-ocid="qibla.angle.card"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Navigation size={12} className="text-islamic-500" />
                </div>
                <div className="text-lg font-display font-bold text-foreground">
                  {Math.round(qiblaAngle)}°
                </div>
                <div className="text-[10px] text-foreground/40 mt-0.5">
                  от севера
                </div>
              </div>

              <div
                className="glass-card rounded-xl p-3 text-center"
                data-ocid="qibla.distance.card"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin size={12} className="text-islamic-500" />
                </div>
                <div className="text-lg font-display font-bold text-foreground">
                  {distance ? `${Math.round(distance / 100) / 10}k` : "—"}
                </div>
                <div className="text-[10px] text-foreground/40 mt-0.5">
                  км до Мекки
                </div>
              </div>

              <div
                className="glass-card rounded-xl p-3 text-center"
                data-ocid="qibla.sensor.card"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Compass
                    size={12}
                    className={
                      sensorAvailable ? "text-green-400" : "text-foreground/30"
                    }
                  />
                </div>
                <div
                  className={`text-xs font-bold ${sensorAvailable ? "text-green-400" : "text-foreground/40"}`}
                >
                  {sensorAvailable ? "Авто" : "Ручной"}
                </div>
                <div className="text-[10px] text-foreground/40 mt-0.5">
                  компас
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location error */}
      <AnimatePresence>
        {locationError && !isLoading && (
          <motion.div
            className="w-full glass-card rounded-xl p-4 mb-4 border border-red-500/25"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-ocid="qibla.error_state"
          >
            <p className="text-sm text-red-400 font-medium mb-1">
              Геолокация недоступна
            </p>
            <p className="text-xs text-foreground/55 mb-3">
              Разрешите доступ в браузере или найдите город:
            </p>
            <Button
              className="w-full mb-2 bg-islamic-500/15 text-islamic-300 border border-islamic-500/30 hover:bg-islamic-500/25 text-sm"
              variant="outline"
              onClick={requestLocation}
              data-ocid="qibla.geolocation.button"
            >
              <LocateFixed size={14} className="mr-2" />
              Определить по геолокации
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-visible search & controls */}
      <div className="w-full space-y-3">
        {/* City search */}
        <div className="flex gap-2">
          <Input
            placeholder="Поиск города или страны..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
            className="bg-secondary border-border text-foreground text-sm h-10"
            data-ocid="qibla.city.search_input"
          />
          <Button
            size="sm"
            className="h-10 px-4 bg-primary text-primary-foreground hover:bg-islamic-400 shrink-0"
            onClick={handleCitySearch}
            disabled={isSearching || !citySearch.trim()}
            data-ocid="qibla.city.submit_button"
          >
            {isSearching ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Search size={14} />
            )}
          </Button>
        </div>

        {/* Geolocation button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-islamic-500/25 text-islamic-300 hover:bg-islamic-500/10 text-xs"
          onClick={requestLocation}
          data-ocid="qibla.retry.button"
        >
          <RefreshCw size={12} className="mr-1.5" />
          {locationName
            ? "Обновить местоположение"
            : "Определить по геолокации"}
        </Button>
      </div>

      <style>{`
        @keyframes compassPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
