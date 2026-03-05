import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Coordinates, Qibla } from "adhan";
import { Compass, MapPin, Navigation, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MECCA_LAT = 21.3891;
const MECCA_LNG = 39.857;

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function drawCompass(
  canvas: HTMLCanvasElement,
  qiblaDeg: number,
  deviceHeading: number | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 12;

  ctx.clearRect(0, 0, W, H);

  // Background circle
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  bgGrad.addColorStop(0, "rgba(30, 20, 10, 0.95)");
  bgGrad.addColorStop(1, "rgba(15, 10, 5, 0.98)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(249, 115, 22, 0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(249, 115, 22, 0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tick marks
  for (let i = 0; i < 360; i += 5) {
    const isMajor = i % 45 === 0;
    const isMinor = i % 15 === 0;
    const rad = (i * Math.PI) / 180;
    const len = isMajor ? 12 : isMinor ? 8 : 4;
    const x1 = cx + (r - 14) * Math.sin(rad);
    const y1 = cy - (r - 14) * Math.cos(rad);
    const x2 = cx + (r - 14 - len) * Math.sin(rad);
    const y2 = cy - (r - 14 - len) * Math.cos(rad);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isMajor
      ? "rgba(249, 115, 22, 0.6)"
      : "rgba(255,255,255,0.2)";
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.stroke();
  }

  // Cardinal labels
  const cardinals = [
    { label: "С", angle: 0 },
    { label: "В", angle: 90 },
    { label: "Ю", angle: 180 },
    { label: "З", angle: 270 },
  ];
  ctx.font = "bold 13px Outfit, sans-serif";
  for (const { label, angle } of cardinals) {
    const rad = (angle * Math.PI) / 180;
    const x = cx + (r - 32) * Math.sin(rad);
    const y = cy - (r - 32) * Math.cos(rad);
    ctx.fillStyle = angle === 0 ? "#f97316" : "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
  }

  // Device rotation offset
  const deviceRad = deviceHeading ? (deviceHeading * Math.PI) / 180 : 0;
  const qiblaRad = ((qiblaDeg - (deviceHeading || 0)) * Math.PI) / 180;

  // Degree marks around the ring (relative to device)
  if (!deviceHeading) {
    // Show degree numbers at 0/90/180/270
    const degs = [0, 90, 180, 270];
    ctx.font = "10px Outfit, sans-serif";
    for (const deg of degs) {
      const rad = (deg * Math.PI) / 180;
      const x = cx + (r - 46) * Math.sin(rad);
      const y = cy - (r - 46) * Math.cos(rad);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${deg}°`, x, y);
    }
  } else {
    // Draw a north pointer (red, thin)
    const northRad = -deviceRad;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(northRad);
    ctx.beginPath();
    ctx.moveTo(0, -(r - 50));
    ctx.lineTo(-4, -10);
    ctx.lineTo(4, -10);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 80, 80, 0.6)";
    ctx.fill();
    ctx.restore();
  }

  // Qibla direction line (subtle)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(qiblaRad);
  const lineGrad = ctx.createLinearGradient(0, -r + 20, 0, r - 20);
  lineGrad.addColorStop(0, "rgba(249, 115, 22, 0.0)");
  lineGrad.addColorStop(0.4, "rgba(249, 115, 22, 0.15)");
  lineGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.3)");
  lineGrad.addColorStop(0.6, "rgba(249, 115, 22, 0.15)");
  lineGrad.addColorStop(1, "rgba(249, 115, 22, 0.0)");
  ctx.beginPath();
  ctx.moveTo(0, -(r - 20));
  ctx.lineTo(0, r - 20);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Qibla arrow (orange, prominent)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(qiblaRad);

  // Arrow shaft
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(0, -(r - 40));
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(0, -(r - 36));
  ctx.lineTo(-8, -(r - 52));
  ctx.lineTo(0, -(r - 48));
  ctx.lineTo(8, -(r - 52));
  ctx.closePath();
  ctx.fillStyle = "#f97316";
  ctx.fill();

  // Kaaba icon at tip
  ctx.font = "14px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🕋", 0, -(r - 62));

  ctx.restore();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#f97316";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Glow effect for qibla direction
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(qiblaRad);
  const glowGrad = ctx.createRadialGradient(0, -(r - 50), 0, 0, -(r - 50), 20);
  glowGrad.addColorStop(0, "rgba(249, 115, 22, 0.4)");
  glowGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
  ctx.beginPath();
  ctx.arc(0, -(r - 50), 20, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();
  ctx.restore();
}

// Read saved location from shared localStorage key
function readStoredLocationQibla(): { lat: number; lng: number } | null {
  try {
    const stored = localStorage.getItem("prayer_location");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.lat && parsed.lng) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export default function QiblaTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const animFrameRef = useRef<number | null>(null);

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
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        computeQibla(lat, lng);
        setIsLoading(false);
        // Save to shared localStorage so other tabs can reuse it
        try {
          const existingName = (() => {
            try {
              const s = localStorage.getItem("prayer_location");
              return s ? JSON.parse(s).name : null;
            } catch {
              return null;
            }
          })();
          localStorage.setItem(
            "prayer_location",
            JSON.stringify({
              lat,
              lng,
              name: existingName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            }),
          );
        } catch {
          // ignore
        }
      },
      (err) => {
        setLocationError(true);
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Доступ к геолокации запрещён. Разрешите доступ в браузере или введите координаты вручную.",
          );
        } else {
          toast.error("Не удалось определить местоположение.");
        }
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  }, [computeQibla]);

  // On mount: try localStorage first, only request geolocation if nothing cached
  useEffect(() => {
    const stored = readStoredLocationQibla();
    if (stored) {
      computeQibla(stored.lat, stored.lng);
      setIsLoading(false);
    } else {
      requestLocation();
    }
  }, [computeQibla, requestLocation]);

  // Device orientation
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      // Alpha = compass heading (degrees from north, clockwise)
      if (e.alpha !== null) {
        setSensorAvailable(true);
        // On iOS, webkitCompassHeading is more reliable
        const webkitEvent = e as DeviceOrientationEvent & {
          webkitCompassHeading?: number;
        };
        const heading = webkitEvent.webkitCompassHeading ?? e.alpha;
        setDeviceHeading(heading);
      }
    };

    if (typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", handler, true);
    }
    return () => {
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, []);

  // Render compass
  useEffect(() => {
    if (!canvasRef.current || qiblaAngle === null) return;

    const render = () => {
      if (canvasRef.current) {
        drawCompass(canvasRef.current, qiblaAngle, deviceHeading);
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [qiblaAngle, deviceHeading]);

  const handleManualSubmit = () => {
    const lat = Number.parseFloat(manualLat);
    const lng = Number.parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    computeQibla(lat, lng);
    setLocationError(false);
    setIsLoading(false);
    try {
      localStorage.setItem(
        "prayer_location",
        JSON.stringify({
          lat,
          lng,
          name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        }),
      );
    } catch {
      // ignore
    }
  };

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
      const name = parts.join(",").trim();
      computeQibla(lat, lng);
      setLocationError(false);
      setIsLoading(false);
      setCitySearch("");
      // Save to shared localStorage
      try {
        localStorage.setItem(
          "prayer_location",
          JSON.stringify({ lat, lng, name }),
        );
      } catch {
        // ignore
      }
    } catch {
      toast.error("Ошибка поиска. Проверьте интернет-соединение");
    } finally {
      setIsSearching(false);
    }
  }, [citySearch, computeQibla]);

  return (
    <div className="flex flex-col items-center px-4 py-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-display font-bold text-gradient-orange mb-1">
          Направление Киблы
        </h2>
        <p className="text-foreground/50 text-sm">Сторона на Священную Мекку</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          <Skeleton
            className="w-64 h-64 rounded-full bg-secondary"
            data-ocid="qibla.loading_state"
          />
          <Skeleton className="w-40 h-6 rounded bg-secondary" />
          <Skeleton className="w-32 h-5 rounded bg-secondary" />
        </div>
      )}

      {/* Location error */}
      {locationError && !isLoading && (
        <div
          className="w-full glass-card rounded-xl p-4 mb-4 border border-red-500/30 space-y-3"
          data-ocid="qibla.error_state"
        >
          <p className="text-sm text-red-400 font-medium">
            Геолокация недоступна
          </p>
          <p className="text-xs text-foreground/60">
            Разрешите доступ к геолокации в браузере, или найдите город:
          </p>
          {/* City search */}
          <div className="flex gap-2">
            <Input
              placeholder="Поиск города или страны..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
              className="bg-secondary border-border text-foreground text-xs h-9"
              data-ocid="qibla.city.search_input"
            />
            <Button
              size="sm"
              className="h-9 px-3 bg-primary text-primary-foreground hover:bg-orange-400 shrink-0"
              onClick={handleCitySearch}
              disabled={isSearching || !citySearch.trim()}
              data-ocid="qibla.city.submit_button"
            >
              {isSearching ? (
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Search size={13} />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
            onClick={requestLocation}
            data-ocid="qibla.retry.button"
          >
            Повторить геолокацию
          </Button>
          {/* Manual coords fallback */}
          <details className="text-xs">
            <summary className="text-foreground/40 cursor-pointer select-none">
              Ввести координаты вручную
            </summary>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Широта"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="bg-secondary border-border text-foreground text-sm"
              />
              <Input
                placeholder="Долгота"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <Button
              size="sm"
              className="w-full mt-2 bg-primary text-primary-foreground"
              onClick={handleManualSubmit}
            >
              Показать Киблу
            </Button>
          </details>
        </div>
      )}

      {/* Compass */}
      {!isLoading && qiblaAngle !== null && (
        <>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-2xl" />
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="relative compass-glow"
              data-ocid="qibla.compass.canvas_target"
            />
          </div>

          {/* Info cards */}
          <div className="w-full grid grid-cols-2 gap-3 mb-4">
            <div className="glass-card rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <Navigation size={14} />
                <span className="text-xs text-foreground/50">Направление</span>
              </div>
              <div className="text-xl font-display font-bold text-foreground">
                {Math.round(qiblaAngle)}°
              </div>
              <div className="text-xs text-foreground/40">от севера</div>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <MapPin size={14} />
                <span className="text-xs text-foreground/50">До Мекки</span>
              </div>
              <div className="text-xl font-display font-bold text-foreground">
                {distance
                  ? `${Math.round(distance).toLocaleString("ru")}`
                  : "—"}
              </div>
              <div className="text-xs text-foreground/40">км</div>
            </div>
          </div>

          {/* Sensor status */}
          <div className="flex items-center gap-2 text-xs text-foreground/40">
            <Compass
              size={12}
              className={
                sensorAvailable ? "text-orange-500" : "text-foreground/30"
              }
            />
            {sensorAvailable
              ? "Компас работает по датчику устройства"
              : "Датчик ориентации недоступен — статичное направление"}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-orange-400 hover:text-orange-300 text-xs"
            onClick={requestLocation}
          >
            <RefreshCw size={12} className="mr-1" />
            Обновить местоположение
          </Button>
        </>
      )}
    </div>
  );
}
