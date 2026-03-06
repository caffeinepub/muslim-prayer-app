import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BellOff,
  Loader2,
  Lock,
  LogOut,
  Moon,
  Pencil,
  ShieldCheck,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { useGetTasbihCounters } from "../hooks/useQueries";

// Специальный пароль автора (только для администратора)
const AUTHOR_PASSWORD = "friday2026admin";
const AUTHOR_SESSION_KEY = "author_session";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

// ─── Utility: get today's completed prayers ───────────────────────────────────
function getTodayPrayersDone(): string[] {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem("prayer_completed_today");
    if (raw) {
      const data = JSON.parse(raw) as { date: string; keys: string[] };
      if (data.date === today) return data.keys;
    }
  } catch {
    /* ignore */
  }
  return [];
}

const PRAYER_NAME_MAP: Record<string, string> = {
  fajr: "Фаджр",
  dhuhr: "Зухр",
  asr: "Аср",
  maghrib: "Магриб",
  isha: "Иша",
};

// ─── Utility: get read surahs with details ───────────────────────────────────
function getReadSurahsDetail(): number[] {
  try {
    const raw = localStorage.getItem("quran_read_surahs");
    if (raw) return JSON.parse(raw) as number[];
  } catch {
    /* ignore */
  }
  return [];
}

// ─── Notification Section ─────────────────────────────────────────────────────
interface NotifSettings {
  iftar: boolean;
  suhur: boolean;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

function parseTimeToMs(timeStr: string): number | null {
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h,
    m,
    0,
    0,
  );
  return target.getTime();
}

function scheduleNotificationsImpl(
  settings: NotifSettings,
  timeoutRefs: React.MutableRefObject<ReturnType<typeof setTimeout>[]>,
) {
  // Clear existing timeouts
  timeoutRefs.current.forEach(clearTimeout);
  timeoutRefs.current = [];

  if (Notification.permission !== "granted") return;

  const now = Date.now();
  const TEN_MIN = 10 * 60 * 1000;
  const icon = "/assets/generated/mosque-logo-transparent.dim_200x200.png";

  let prayerTimes: Record<string, string> = {};
  let ramadanTimes: Record<string, string> = {};

  try {
    const raw = localStorage.getItem("prayer_times_cache");
    if (raw) prayerTimes = JSON.parse(raw) as Record<string, string>;
  } catch {
    /* ignore */
  }

  try {
    const raw = localStorage.getItem("ramadan_times_cache");
    if (raw) ramadanTimes = JSON.parse(raw) as Record<string, string>;
  } catch {
    /* ignore */
  }

  type NotifEntry = {
    enabled: boolean;
    timeKey: string;
    source: Record<string, string>;
    offset: number;
    title: string;
    body: string;
  };

  const entries: NotifEntry[] = [
    {
      enabled: settings.iftar,
      timeKey: "iftar",
      source: ramadanTimes,
      offset: -TEN_MIN,
      title: "🌙 Ифтар через 10 минут",
      body: "Приготовьтесь к разговению. Аллах принимает ваш пост!",
    },
    {
      enabled: settings.suhur,
      timeKey: "suhur",
      source: ramadanTimes,
      offset: -TEN_MIN,
      title: "⭐ Сухур через 10 минут",
      body: "Поспешите поесть перед началом поста.",
    },
    {
      enabled: settings.fajr,
      timeKey: "fajr",
      source: prayerTimes,
      offset: 0,
      title: "🕌 Время Фаджра",
      body: "Пришло время утреннего намаза.",
    },
    {
      enabled: settings.dhuhr,
      timeKey: "dhuhr",
      source: prayerTimes,
      offset: 0,
      title: "🕌 Время Зухра",
      body: "Пришло время полуденного намаза.",
    },
    {
      enabled: settings.asr,
      timeKey: "asr",
      source: prayerTimes,
      offset: 0,
      title: "🕌 Время Аср",
      body: "Пришло время послеполуденного намаза.",
    },
    {
      enabled: settings.maghrib,
      timeKey: "maghrib",
      source: prayerTimes,
      offset: 0,
      title: "🕌 Время Магриба",
      body: "Пришло время вечернего намаза.",
    },
    {
      enabled: settings.isha,
      timeKey: "isha",
      source: prayerTimes,
      offset: 0,
      title: "🕌 Время Иша",
      body: "Пришло время ночного намаза.",
    },
  ];

  for (const entry of entries) {
    if (!entry.enabled) continue;
    const timeStr = entry.source[entry.timeKey];
    if (!timeStr) continue;
    const targetMs = parseTimeToMs(timeStr);
    if (!targetMs) continue;
    const fireAt = targetMs + entry.offset;
    const delay = fireAt - now;
    if (delay <= 0) continue; // already passed today

    const id = setTimeout(() => {
      new Notification(entry.title, { body: entry.body, icon });
    }, delay);
    timeoutRefs.current.push(id);
  }
}

function NotificationSection() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === "undefined") return "denied";
    // Always sync with actual browser state
    return Notification.permission;
  });
  const [isDeniedMsg, setIsDeniedMsg] = useState(false);

  const [settings, setSettings] = useState<NotifSettings>(() => ({
    iftar: localStorage.getItem("notif_iftar") !== "false",
    suhur: localStorage.getItem("notif_suhur") !== "false",
    fajr: localStorage.getItem("notif_fajr") !== "false",
    dhuhr: localStorage.getItem("notif_dhuhr") !== "false",
    asr: localStorage.getItem("notif_asr") !== "false",
    maghrib: localStorage.getItem("notif_maghrib") !== "false",
    isha: localStorage.getItem("notif_isha") !== "false",
  }));

  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Schedule on mount and when settings change
  useEffect(() => {
    if (permission === "granted") {
      scheduleNotificationsImpl(settings, timeoutRefs);
    }
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, [permission, settings]);

  const handleEnableNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Ваш браузер не поддерживает уведомления");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    localStorage.setItem("notif_permission", result);
    if (result === "granted") {
      toast.success("Уведомления включены!");
    } else if (result === "denied") {
      setIsDeniedMsg(true);
    }
  };

  const handleToggle = (key: keyof NotifSettings, value: boolean) => {
    const localKey = `notif_${key}`;
    localStorage.setItem(localKey, String(value));
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (typeof Notification === "undefined") return null;

  const toggleRows: {
    key: keyof NotifSettings;
    label: string;
    ocid: string;
  }[] = [
    {
      key: "iftar",
      label: "За 10 мин до ифтара",
      ocid: "profile.notifications.iftar.switch",
    },
    {
      key: "suhur",
      label: "За 10 мин до сухура",
      ocid: "profile.notifications.suhur.switch",
    },
    {
      key: "fajr",
      label: "Напоминание Фаджр",
      ocid: "profile.notifications.fajr.switch",
    },
    {
      key: "dhuhr",
      label: "Напоминание Зухр",
      ocid: "profile.notifications.dhuhr.switch",
    },
    {
      key: "asr",
      label: "Напоминание Аср",
      ocid: "profile.notifications.asr.switch",
    },
    {
      key: "maghrib",
      label: "Напоминание Магриб",
      ocid: "profile.notifications.maghrib.switch",
    },
    {
      key: "isha",
      label: "Напоминание Иша",
      ocid: "profile.notifications.isha.switch",
    },
  ];

  return (
    <div className="space-y-3">
      {permission !== "granted" ? (
        /* ── Phase 1: request permission ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-orange-400" />
            <span className="text-sm font-bold text-foreground">
              Уведомления
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Включите уведомления, чтобы не пропустить время намаза, сухура и
            ифтара
          </p>
          {isDeniedMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-xl p-3"
            >
              <BellOff size={14} />
              <span>
                Уведомления заблокированы в браузере. Разрешите их в настройках
                сайта.
              </span>
            </motion.div>
          )}
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-orange-400 font-semibold h-10"
            onClick={() => void handleEnableNotifications()}
            data-ocid="profile.notifications.enable.button"
          >
            <Bell size={14} className="mr-2" />
            Включить уведомления
          </Button>
        </motion.div>
      ) : (
        /* ── Phase 2: settings panel ── */
        <motion.div
          initial={{ opacity: 0, y: -8, scaleY: 0.97 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass-card rounded-2xl p-5 space-y-4 origin-top"
        >
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-orange-400" />
            <span className="text-sm font-bold text-foreground">
              Настройки уведомлений
            </span>
            <span className="ml-auto text-xs text-green-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Активно
            </span>
          </div>

          <div className="space-y-0.5">
            {toggleRows.map((row, i) => (
              <motion.div
                key={row.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex items-center justify-between py-2.5 border-b border-orange-500/8 last:border-0"
              >
                <span className="text-sm text-foreground/80">{row.label}</span>
                <Switch
                  checked={settings[row.key]}
                  onCheckedChange={(val) => handleToggle(row.key, val)}
                  data-ocid={row.ocid}
                  className="data-[state=checked]:bg-orange-500"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── AvatarCircle (exported for App.tsx) ─────────────────────────────────────
function AvatarCircle({
  name,
  email,
  size = "lg",
}: {
  name?: string;
  email?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = (() => {
    if (name?.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.trim().slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "ИИ";
  })();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-display font-bold text-black shadow-lg shadow-orange-500/25 border-2 border-orange-500/40 flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// ─── Google Sign-In Button ─────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({ onAuthorLogin }: { onAuthorLogin: () => void }) {
  const { signInWithGoogle } = useFirebaseAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authorPassword, setAuthorPassword] = useState("");
  const [authorError, setAuthorError] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast.success("Добро пожаловать!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        !msg.includes("popup-closed-by-user") &&
        !msg.includes("cancelled-popup-request")
      ) {
        toast.error("Ошибка входа через Google. Попробуйте ещё раз.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAuthorLogin = () => {
    if (authorPassword === AUTHOR_PASSWORD) {
      sessionStorage.setItem(AUTHOR_SESSION_KEY, "1");
      onAuthorLogin();
      toast.success("Добро пожаловать, Администратор!");
    } else {
      setAuthorError(true);
      setTimeout(() => setAuthorError(false), 1500);
    }
  };

  return (
    <motion.div
      key="login"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 px-4 py-6"
    >
      {/* Arabic calligraphy header */}
      <div className="text-center space-y-2">
        <div
          className="text-4xl leading-relaxed text-orange-400 drop-shadow-lg"
          style={{ fontFamily: "serif", direction: "rtl" }}
        >
          بِسْمِ اللَّهِ
        </div>
        <div className="text-sm text-muted-foreground font-display">
          Во имя Аллаха
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Google Sign-In */}
        <motion.div
          className="glass-card rounded-2xl p-5 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Войти в аккаунт
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Сохраняйте настройки и прогресс между устройствами
            </p>
          </div>

          <Button
            className="w-full h-11 bg-white hover:bg-gray-50 text-gray-800 font-semibold border border-gray-200 shadow-sm gap-2.5 transition-all duration-200 hover:shadow-md"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSigningIn}
            data-ocid="profile.google.submit_button"
          >
            {isSigningIn ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-gray-500" />
                <span className="text-gray-600">Вход...</span>
              </span>
            ) : (
              <>
                <GoogleIcon />
                <span>Войти через Google</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* Author login */}
        <div className="glass-card rounded-2xl p-5 space-y-3 border border-orange-500/10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-orange-400" />
            <span className="text-sm font-semibold text-foreground">
              Вход автора
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Только для администратора приложения.
          </p>
          <motion.div
            animate={authorError ? { x: [-6, 6, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-3"
          >
            <Input
              type="password"
              placeholder="Специальный пароль"
              value={authorPassword}
              onChange={(e) => setAuthorPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuthorLogin()}
              className={`bg-secondary/50 h-10 ${
                authorError
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-orange-500/20 focus:border-orange-500/50"
              }`}
              data-ocid="profile.author.input"
              autoComplete="off"
            />
            {authorError && (
              <p className="text-xs text-red-400">Неверный пароль</p>
            )}
            <Button
              className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 font-semibold h-10"
              variant="outline"
              onClick={handleAuthorLogin}
              disabled={!authorPassword.trim()}
              data-ocid="profile.author.submit_button"
            >
              <Lock size={14} className="mr-2" />
              Войти как автор
            </Button>
          </motion.div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 leading-relaxed">
          Войдите, чтобы сохранять настройки намаза, тасбих и профиль между
          устройствами
        </p>
      </div>
    </motion.div>
  );
}

// ─── Today's Namaz Section (compact for 2-col grid) ──────────────────────────
function TodayNamazSection() {
  const prayersDone = getTodayPrayersDone();
  const count = prayersDone.length;
  const allFive = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3 flex flex-col">
      <div className="flex items-center gap-1.5">
        <span className="text-base">🕌</span>
        <span className="text-xs font-bold text-foreground">Намаз</span>
        <span className="ml-auto text-orange-400 font-bold text-sm leading-none">
          {count}/5
        </span>
      </div>
      {/* Progress arc */}
      <div className="flex items-center justify-center">
        <div className="relative w-16 h-16">
          <svg
            viewBox="0 0 64 64"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label="Прогресс намазов"
          >
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-foreground/10"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              className="text-orange-500"
              strokeDasharray={`${2 * Math.PI * 26}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 26 * (1 - count / 5),
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">{count}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        {allFive.map((key) => {
          const done = prayersDone.includes(key);
          return (
            <motion.div
              key={key}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg border transition-all duration-300 ${
                done
                  ? "bg-green-500/15 border-green-500/30"
                  : "bg-foreground/5 border-foreground/10"
              }`}
            >
              <span
                className={`text-[7px] font-semibold leading-none ${done ? "text-green-400" : "text-foreground/25"}`}
              >
                {PRAYER_NAME_MAP[key].slice(0, 3)}
              </span>
              <span className="text-xs">{done ? "✅" : "◻️"}</span>
            </motion.div>
          );
        })}
      </div>
      {count === 5 && (
        <p className="text-center text-[10px] text-green-400 font-semibold">
          МашаАллах! 🤲
        </p>
      )}
    </div>
  );
}

// ─── Tasbih Stats Card (compact for 2-col grid) ───────────────────────────────
function TasbihStatsCard({
  totalTasbih,
  tasbihCounters,
}: {
  totalTasbih: number;
  tasbihCounters?: Array<{ name: string; count: bigint; target: bigint }>;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3 flex flex-col">
      <div className="flex items-center gap-1.5">
        <span className="text-base">📿</span>
        <span className="text-xs font-bold text-foreground">Тасбих</span>
        <span className="ml-auto text-orange-400 font-bold text-sm leading-none">
          {totalTasbih}
        </span>
      </div>
      {/* Big count display */}
      <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <motion.div
            key={totalTasbih}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-display font-bold text-orange-400"
          >
            {totalTasbih}
          </motion.div>
          <div className="text-[10px] text-muted-foreground mt-0.5">зикров</div>
        </div>
      </div>
      {/* Mini progress bars */}
      {tasbihCounters && tasbihCounters.length > 0 && (
        <div className="space-y-1.5">
          {tasbihCounters.slice(0, 2).map((counter) => {
            const pct = Math.min(
              (Number(counter.count) / Number(counter.target)) * 100,
              100,
            );
            return (
              <div key={counter.name} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground truncate max-w-[80px]">
                    {counter.name}
                  </span>
                  <span className="text-orange-400/70 font-medium shrink-0 ml-1">
                    {Number(counter.count)}/{Number(counter.target)}
                  </span>
                </div>
                <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-500/70 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Quran Stats Section ──────────────────────────────────────────────────────
function QuranStatsSection() {
  const [expanded, setExpanded] = useState(false);
  const readIds = getReadSurahsDetail();
  const count = readIds.length;

  // Import surah names for display
  const surahNames: Record<number, string> = {
    1: "Аль-Фатиха",
    2: "Аль-Бакара",
    3: "Аль-Имран",
    4: "Ан-Ниса",
    5: "Аль-Маида",
    6: "Аль-Анам",
    7: "Аль-Аараф",
    8: "Аль-Анфаль",
    9: "Ат-Тауба",
    10: "Юнус",
    36: "Ясин",
    55: "Ар-Рахман",
    56: "Аль-Вакия",
    67: "Аль-Мульк",
    78: "Ан-Наба",
    110: "Ан-Наср",
    111: "Аль-Масад",
    112: "Аль-Ихлас",
    113: "Аль-Фалак",
    114: "Ан-Нас",
  };

  const surahRakaat: Record<number, number> = {
    1: 7,
    112: 4,
    113: 5,
    114: 6,
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">📖</span>
        <span className="text-sm font-bold text-foreground">Коран</span>
        <span className="ml-auto text-green-400 font-bold text-lg leading-none">
          {count} сур
        </span>
        {count > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-2 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            data-ocid="profile.quran.expand.toggle"
          >
            {expanded ? "Скрыть" : "Подробнее"}
          </button>
        )}
      </div>
      {count === 0 && (
        <p className="text-xs text-foreground/40">
          Ни одной суры ещё не прочитано
        </p>
      )}
      {expanded && count > 0 && (
        <div className="space-y-2 pt-1">
          <Separator className="bg-orange-500/10" />
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {readIds.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between text-xs py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[9px] font-bold text-green-400">
                    {id}
                  </span>
                  <span className="text-foreground/70">
                    {surahNames[id] || `Сура ${id}`}
                  </span>
                </div>
                {surahRakaat[id] && (
                  <span className="text-foreground/40">
                    {surahRakaat[id]} аятов
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User ProfileScreen ───────────────────────────────────────────────────────
function ProfileScreen() {
  const {
    user: firebaseUser,
    profile,
    signOut,
    saveProfile,
    isLoading,
  } = useFirebaseAuth();
  const { data: tasbihCounters } = useGetTasbihCounters();

  const localStoredName = localStorage.getItem("user_display_name") || "";
  const displayName =
    localStoredName ||
    profile?.name ||
    (firebaseUser?.email ? firebaseUser.email.split("@")[0] : null) ||
    "";
  const displayEmail = firebaseUser?.email || "";

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameEdit, setNameEdit] = useState(displayName);
  const [savedName, setSavedName] = useState(localStoredName || displayName);
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // roleTitle: show saved name if set, otherwise default
  const roleTitle = savedName.trim() ? savedName.trim() : "Мусульманин";

  const totalTasbih =
    tasbihCounters?.reduce((acc, c) => acc + Number(c.count), 0) ?? 0;

  const handleStartEditing = () => {
    setNameEdit(savedName);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleSaveName = async () => {
    if (!nameEdit.trim()) return;
    setIsSavingName(true);
    try {
      await saveProfile({ name: nameEdit.trim() });
      localStorage.setItem("user_display_name", nameEdit.trim());
      setSavedName(nameEdit.trim());
      setIsEditingName(false);
      toast.success("Имя сохранено");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setNameEdit(savedName);
    setIsEditingName(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Вы вышли из аккаунта");
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-60"
        data-ocid="profile.loading_state"
      >
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      key="profile"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4 px-4 py-5"
    >
      {/* ── Hero Section ── */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.55 0.18 45 / 0.12) 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-orange-500/5 blur-2xl pointer-events-none" />

        {/* Avatar + info */}
        <div className="flex flex-col items-center gap-4 relative">
          {/* Pulse ring behind avatar */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute w-28 h-28 rounded-full border border-orange-500/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute w-24 h-24 rounded-full border border-orange-500/15"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
            <AvatarCircle name={displayName} email={displayEmail} size="lg" />
          </div>

          {/* Role title — click to edit */}
          <div className="text-center space-y-1.5 w-full">
            {isEditingName ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 justify-center"
              >
                <Input
                  ref={nameInputRef}
                  value={nameEdit}
                  onChange={(e) => setNameEdit(e.target.value)}
                  placeholder="Введите имя"
                  className="bg-secondary/50 border-orange-500/30 focus:border-orange-500/60 text-sm h-9 max-w-[180px] text-center"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  data-ocid="profile.name.input"
                />
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-orange-400 h-9 px-3 text-xs font-semibold shrink-0"
                  onClick={() => void handleSaveName()}
                  disabled={isSavingName || !nameEdit.trim()}
                  data-ocid="profile.name.save_button"
                >
                  {isSavingName ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="group flex items-center justify-center gap-2 mx-auto"
                title="Нажмите, чтобы изменить имя"
                data-ocid="profile.name.edit_button"
              >
                <h2 className="text-2xl font-display font-bold text-gradient-orange group-hover:opacity-80 transition-opacity">
                  {roleTitle}
                </h2>
                <Pencil
                  size={14}
                  className="text-orange-400/50 group-hover:text-orange-400 transition-colors mt-0.5"
                />
              </button>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <Moon size={13} className="text-orange-400/70" />
              <span className="text-xs text-muted-foreground">
                {displayEmail}
              </span>
            </div>
            {/* Arabic phrase */}
            <div
              className="text-sm text-orange-400/50 leading-relaxed"
              style={{ fontFamily: "serif", direction: "rtl" }}
            >
              بارك الله فيك
            </div>
          </div>
        </div>
      </div>

      {/* ── Notifications Section ── */}
      <NotificationSection />

      {/* ── 2-column grid: Namaz + Tasbih ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Namaz */}
        <TodayNamazSection />
        {/* Tasbih */}
        <TasbihStatsCard
          totalTasbih={totalTasbih}
          tasbihCounters={tasbihCounters}
        />
      </div>

      {/* ── Quran Stats — full width ── */}
      <QuranStatsSection />

      {/* ── Sign out ── */}
      <Button
        variant="destructive"
        className="w-full h-11 font-semibold mt-1"
        onClick={() => void handleSignOut()}
        data-ocid="profile.signout.button"
      >
        <LogOut size={16} className="mr-2" />
        Выйти из аккаунта
      </Button>

      <CaffeineFooter />
    </motion.div>
  );
}

// ─── Admin (Author) Profile Screen ────────────────────────────────────────────
function AuthorProfileScreen({ onSignOut }: { onSignOut: () => void }) {
  const { data: tasbihCounters } = useGetTasbihCounters();
  const totalTasbih =
    tasbihCounters?.reduce((acc, c) => acc + Number(c.count), 0) ?? 0;

  return (
    <motion.div
      key="author-profile"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4 px-4 py-5"
    >
      {/* ── Admin Hero ── */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.55 0.18 45 / 0.15) 0%, transparent 70%)",
          }}
        />

        <div className="flex flex-col items-center gap-4 relative">
          {/* Avatar with glow ring */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute w-28 h-28 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, oklch(0.65 0.20 45 / 0.4), oklch(0.55 0.18 45 / 0.1), oklch(0.65 0.20 45 / 0.4))",
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-display font-bold text-black text-2xl shadow-2xl shadow-orange-500/40 border-2 border-orange-500/60 z-10">
              АД
            </div>
          </div>

          {/* Role */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-bold text-gradient-orange">
              Администратор
            </h2>
            <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-orange-500/15 border border-orange-500/30 rounded-full mx-auto w-fit">
              <Star size={12} className="text-orange-400 fill-orange-400" />
              <span className="text-xs text-orange-400 font-semibold">
                Автор приложения
              </span>
              <Star size={12} className="text-orange-400 fill-orange-400" />
            </div>
            <div
              className="text-sm text-orange-400/50 leading-relaxed"
              style={{ fontFamily: "serif", direction: "rtl" }}
            >
              الحمد لله
            </div>
          </div>
        </div>
      </div>

      {/* ── Notifications Section ── */}
      <NotificationSection />

      {/* ── 2-column grid: Namaz + Tasbih ── */}
      <div className="grid grid-cols-2 gap-3">
        <TodayNamazSection />
        <TasbihStatsCard
          totalTasbih={totalTasbih}
          tasbihCounters={tasbihCounters}
        />
      </div>

      {/* ── Quran Stats ── */}
      <QuranStatsSection />

      {/* ── Sign out ── */}
      <Button
        variant="destructive"
        className="w-full h-11 font-semibold mt-1"
        onClick={onSignOut}
        data-ocid="profile.author.signout.button"
      >
        <LogOut size={16} className="mr-2" />
        Выйти из аккаунта автора
      </Button>

      <CaffeineFooter />
    </motion.div>
  );
}

function CaffeineFooter() {
  return (
    <p className="text-center text-[10px] text-muted-foreground/40 pb-2">
      © {new Date().getFullYear()}.{" "}
      <a
        href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        Built with love using caffeine.ai
      </a>
    </p>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ProfileTab() {
  const { user: firebaseUser } = useFirebaseAuth();
  const [isAuthorLoggedIn, setIsAuthorLoggedIn] = useState(
    () => sessionStorage.getItem(AUTHOR_SESSION_KEY) === "1",
  );

  const isLoggedIn = !!firebaseUser || isAuthorLoggedIn;

  const handleAuthorLogin = () => {
    setIsAuthorLoggedIn(true);
  };

  const handleAuthorSignOut = () => {
    sessionStorage.removeItem(AUTHOR_SESSION_KEY);
    setIsAuthorLoggedIn(false);
    toast.success("Вы вышли из аккаунта автора");
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-display font-bold text-gradient-orange">
          Профиль
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isLoggedIn
            ? "Управление аккаунтом и достижениями"
            : "Войдите, чтобы сохранять прогресс"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {firebaseUser ? (
          <ProfileScreen key="logged-in" />
        ) : isAuthorLoggedIn ? (
          <AuthorProfileScreen key="author" onSignOut={handleAuthorSignOut} />
        ) : (
          <LoginScreen key="logged-out" onAuthorLogin={handleAuthorLogin} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Export avatar for use in App.tsx header
export { AvatarCircle };
