import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import {
  useGetPrayerSettings,
  useGetTasbihCounters,
} from "../hooks/useQueries";

// Специальный пароль автора (только для администратора)
const AUTHOR_PASSWORD = "friday2026admin";
const AUTHOR_SESSION_KEY = "author_session";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

// ─── Utility: read achievement stats from localStorage ───────────────────────
function getAchievementStats() {
  const tasbihTotal = Number(localStorage.getItem("tasbih_total_count") || "0");
  const prayersChecked = Number(localStorage.getItem("prayers_checked") || "0");
  const streak = Number(localStorage.getItem("usage_streak") || "0");

  let quranRead: number[] = [];
  try {
    const raw = localStorage.getItem("quran_read_surahs");
    if (raw) quranRead = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  return {
    tasbihTotal,
    prayersChecked,
    streak,
    quranReadCount: quranRead.length,
  };
}

// ─── Achievement level getters ────────────────────────────────────────────────
function getTasbihLevel(total: number) {
  if (total >= 10000) return { label: "Мастер", level: 5, max: 5 };
  if (total >= 2000) return { label: "Знаток", level: 4, max: 5 };
  if (total >= 500) return { label: "Усердный", level: 3, max: 5 };
  if (total >= 100) return { label: "Практикующий", level: 2, max: 5 };
  return { label: "Начинающий", level: 1, max: 5 };
}

function getQuranLevel(count: number) {
  if (count >= 114) return { label: "Знаток Корана", level: 5, max: 5 };
  if (count >= 50) return { label: "Хафиз на пути", level: 4, max: 5 };
  if (count >= 20) return { label: "Знаток", level: 3, max: 5 };
  if (count >= 5) return { label: "Читатель", level: 2, max: 5 };
  if (count >= 1) return { label: "Первые шаги", level: 1, max: 5 };
  return { label: "Не начато", level: 0, max: 5 };
}

function getPrayerLevel(count: number) {
  if (count >= 100) return { label: "Столп веры", level: 4, max: 4 };
  if (count >= 25) return { label: "Верный", level: 3, max: 4 };
  if (count >= 5) return { label: "Намазник", level: 2, max: 4 };
  if (count >= 1) return { label: "Начало пути", level: 1, max: 4 };
  return { label: "Не начато", level: 0, max: 4 };
}

function getStreakLevel(days: number) {
  if (days >= 30) return { label: "Столп", level: 5, max: 5 };
  if (days >= 14) return { label: "Привычка", level: 4, max: 5 };
  if (days >= 7) return { label: "Неделя веры", level: 3, max: 5 };
  if (days >= 3) return { label: "Регулярность", level: 2, max: 5 };
  if (days >= 1) return { label: "Старт", level: 1, max: 5 };
  return { label: "Не начато", level: 0, max: 5 };
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function getBadges(
  tasbihTotal: number,
  quranReadCount: number,
  prayersChecked: number,
  streak: number,
) {
  const badges = [
    {
      id: "first_tasbih",
      emoji: "🕌",
      label: "Первый шаг",
      unlocked: tasbihTotal >= 1,
    },
    {
      id: "tasbih_33",
      emoji: "📿",
      label: "33 зикра",
      unlocked: tasbihTotal >= 33,
    },
    {
      id: "al_fatiha",
      emoji: "📖",
      label: "Аль-Фатиха",
      unlocked: quranReadCount >= 1,
    },
    {
      id: "streak_7",
      emoji: "⭐",
      label: "7 дней подряд",
      unlocked: streak >= 7,
    },
    {
      id: "ramadan_spirit",
      emoji: "🌙",
      label: "Рамадан духа",
      unlocked: prayersChecked >= 50,
    },
  ];
  return badges;
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

// ─── Achievement Card ─────────────────────────────────────────────────────────
function AchievementCard({
  icon,
  title,
  levelLabel,
  level,
  maxLevel,
  value,
  valueLabel,
  color,
  delay,
}: {
  icon: string;
  title: string;
  levelLabel: string;
  level: number;
  maxLevel: number;
  value: number;
  valueLabel: string;
  color: string;
  delay: number;
}) {
  const progressPct = maxLevel > 0 ? Math.round((level / maxLevel) * 100) : 0;
  const isStarted = level > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="glass-card rounded-2xl p-4 flex flex-col gap-2.5 relative overflow-hidden"
    >
      {/* Background glow */}
      {isStarted && (
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-25"
          style={{ background: color }}
        />
      )}

      {/* Icon + title */}
      <div className="flex items-center gap-2">
        <motion.span
          className="text-2xl leading-none"
          animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            delay,
            ease: "easeInOut",
          }}
        >
          {icon}
        </motion.span>
        <span className="text-xs font-semibold text-foreground/80 truncate">
          {title}
        </span>
      </div>

      {/* Level name */}
      <div
        className="text-sm font-bold truncate"
        style={{ color: isStarted ? color : "var(--muted-foreground)" }}
      >
        {levelLabel}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Counts */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{valueLabel}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {value}
        </span>
      </div>

      {/* Level pip track */}
      <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: color,
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({ onAuthorLogin }: { onAuthorLogin: () => void }) {
  const { signInWithEmail } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [isSending, setIsSending] = useState(false);

  const [authorPassword, setAuthorPassword] = useState("");
  const [authorError, setAuthorError] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }
    setIsSending(true);
    try {
      await signInWithEmail(email.trim().toLowerCase());
      setStep("sent");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ошибка отправки письма",
      );
    } finally {
      setIsSending(false);
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
        {/* Email magic link */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-orange-400" />
            <span className="text-sm font-semibold text-foreground">
              Войти по email
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Введите ваш email — мы отправим письмо со ссылкой для входа.
                </p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSendLink()}
                  className="bg-secondary/50 border-orange-500/20 focus:border-orange-500/50 h-10"
                  data-ocid="profile.email.input"
                  autoComplete="email"
                />
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-orange-400 font-semibold h-10"
                  onClick={() => void handleSendLink()}
                  disabled={isSending || !email.trim()}
                  data-ocid="profile.email.submit_button"
                >
                  {isSending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Отправка...
                    </span>
                  ) : (
                    "Отправить ссылку"
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="sent-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 text-center"
                data-ocid="profile.email.success_state"
              >
                <div className="flex justify-center">
                  <CheckCircle2 size={44} className="text-orange-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Письмо отправлено!
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Проверьте почту{" "}
                    <span className="text-orange-400 font-medium">{email}</span>{" "}
                    и нажмите кнопку «Подтвердить» в письме.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center"
                  onClick={() => setStep("email")}
                  data-ocid="profile.email.back_button"
                >
                  Изменить email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

// ─── Achievements Section ─────────────────────────────────────────────────────
function AchievementsSection() {
  const { tasbihTotal, prayersChecked, streak, quranReadCount } =
    getAchievementStats();

  const tasbihLvl = getTasbihLevel(tasbihTotal);
  const quranLvl = getQuranLevel(quranReadCount);
  const prayerLvl = getPrayerLevel(prayersChecked);
  const streakLvl = getStreakLevel(streak);
  const badges = getBadges(tasbihTotal, quranReadCount, prayersChecked, streak);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-orange-400" />
        <span className="text-sm font-bold text-foreground">Достижения</span>
        <span className="ml-auto text-xs text-orange-400 font-semibold">
          {unlockedCount}/{badges.length} 🏅
        </span>
      </div>

      {/* Achievement cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <AchievementCard
          icon="📿"
          title="Тасбих"
          levelLabel={tasbihLvl.label}
          level={tasbihLvl.level}
          maxLevel={tasbihLvl.max}
          value={tasbihTotal}
          valueLabel="всего зикров"
          color="#f97316"
          delay={0.05}
        />
        <AchievementCard
          icon="📖"
          title="Коран"
          levelLabel={quranLvl.label}
          level={quranLvl.level}
          maxLevel={quranLvl.max}
          value={quranReadCount}
          valueLabel="сур прочитано"
          color="#22c55e"
          delay={0.1}
        />
        <AchievementCard
          icon="🕌"
          title="Намаз"
          levelLabel={prayerLvl.label}
          level={prayerLvl.level}
          maxLevel={prayerLvl.max}
          value={prayersChecked}
          valueLabel="намазов совершено"
          color="#a78bfa"
          delay={0.15}
        />
        <AchievementCard
          icon="🔥"
          title="Серия"
          levelLabel={streakLvl.label}
          level={streakLvl.level}
          maxLevel={streakLvl.max}
          value={streak}
          valueLabel="дней подряд"
          color="#fb923c"
          delay={0.2}
        />
      </div>

      {/* Badges row */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
          Медали
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
                badge.unlocked
                  ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                  : "bg-foreground/5 border-foreground/10 text-foreground/25 grayscale"
              }`}
            >
              <motion.span
                animate={badge.unlocked ? { y: [0, -3, 0] } : {}}
                transition={{
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.4,
                  ease: "easeInOut",
                }}
              >
                {badge.emoji}
              </motion.span>
              <span>{badge.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
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
  const { data: prayerSettings } = useGetPrayerSettings();
  const { data: tasbihCounters } = useGetTasbihCounters();

  const displayName =
    profile?.name ||
    (firebaseUser?.email ? firebaseUser.email.split("@")[0] : null) ||
    "";
  const displayEmail = firebaseUser?.email || "";

  const [nameEdit, setNameEdit] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);

  // Gender selection (male = Мусульманин, female = Мусульманка)
  const [gender, setGender] = useState<"male" | "female">(() => {
    const saved = localStorage.getItem("user_gender");
    return saved === "female" ? "female" : "male";
  });

  const handleGenderChange = (g: "male" | "female") => {
    setGender(g);
    localStorage.setItem("user_gender", g);
  };

  const roleTitle = gender === "female" ? "Мусульманка" : "Мусульманин";

  const totalTasbih =
    tasbihCounters?.reduce((acc, c) => acc + Number(c.count), 0) ?? 0;

  const handleSaveName = async () => {
    if (!nameEdit.trim()) return;
    setIsSavingName(true);
    try {
      await saveProfile({ name: nameEdit.trim() });
      toast.success("Имя сохранено");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setIsSavingName(false);
    }
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

          {/* Role title */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-display font-bold text-gradient-orange">
              {roleTitle}
            </h2>
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

          {/* Gender toggle */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleGenderChange("male")}
              data-ocid="profile.gender.male.toggle"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                gender === "male"
                  ? "bg-orange-500 border-orange-500 text-black"
                  : "bg-transparent border-orange-500/30 text-foreground/50 hover:border-orange-500/50"
              }`}
            >
              Мусульманин
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange("female")}
              data-ocid="profile.gender.female.toggle"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                gender === "female"
                  ? "bg-orange-500 border-orange-500 text-black"
                  : "bg-transparent border-orange-500/30 text-foreground/50 hover:border-orange-500/50"
              }`}
            >
              Мусульманка
            </button>
          </div>
        </div>

        {/* Name edit */}
        <div className="mt-5 space-y-2 relative">
          <label
            htmlFor="profile-name"
            className="text-xs text-muted-foreground font-medium"
          >
            Ваше имя
          </label>
          <div className="flex gap-2">
            <Input
              id="profile-name"
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              placeholder="Введите имя"
              className="bg-secondary/50 border-orange-500/20 focus:border-orange-500/50 text-sm h-9 flex-1"
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
          </div>
        </div>
      </div>

      {/* ── Achievements Section ── */}
      <AchievementsSection />

      {/* ── Notifications Section ── */}
      <NotificationSection />

      {/* ── Stats Section ── */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">📿</span>
          <span className="text-sm font-bold text-foreground">
            Тасбих сегодня
          </span>
          <span className="ml-auto text-orange-400 font-bold text-lg leading-none">
            {totalTasbih}
          </span>
        </div>

        {tasbihCounters && tasbihCounters.length > 0 && (
          <>
            <Separator className="bg-orange-500/10" />
            <div className="space-y-2">
              {tasbihCounters.map((counter) => {
                const pct = Math.min(
                  (Number(counter.count) / Number(counter.target)) * 100,
                  100,
                );
                return (
                  <div key={counter.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {counter.name}
                      </span>
                      <span className="text-foreground font-medium">
                        {Number(counter.count)} / {Number(counter.target)}
                      </span>
                    </div>
                    <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500/70 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Prayer Settings ── */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} className="text-orange-400" />
          <span className="text-sm font-bold text-foreground">
            Настройки намаза
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Метод расчёта</span>
            <span className="text-foreground font-medium truncate max-w-[150px] text-right">
              {prayerSettings?.calculationMethod || "Не задан"}
            </span>
          </div>
          <Separator className="bg-orange-500/10" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Мазхаб</span>
            <span className="text-foreground font-medium">
              {prayerSettings?.madhab || "Не задан"}
            </span>
          </div>
          <Separator className="bg-orange-500/10" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Globe size={12} />
              Местоположение
            </span>
            <span className="text-foreground font-medium truncate max-w-[160px] text-right">
              {prayerSettings?.locationName || "Не задано"}
            </span>
          </div>
        </div>
      </div>

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
  const { data: prayerSettings } = useGetPrayerSettings();
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

      {/* ── Admin Achievements ── */}
      <AchievementsSection />

      {/* ── Notifications Section ── */}
      <NotificationSection />

      {/* ── Admin Stats ── */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">📿</span>
          <span className="text-sm font-bold text-foreground">
            Тасбих сегодня
          </span>
          <span className="ml-auto text-orange-400 font-bold text-lg leading-none">
            {totalTasbih}
          </span>
        </div>

        {tasbihCounters && tasbihCounters.length > 0 && (
          <>
            <Separator className="bg-orange-500/10" />
            <div className="space-y-2">
              {tasbihCounters.map((counter) => {
                const pct = Math.min(
                  (Number(counter.count) / Number(counter.target)) * 100,
                  100,
                );
                return (
                  <div key={counter.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {counter.name}
                      </span>
                      <span className="text-foreground font-medium">
                        {Number(counter.count)} / {Number(counter.target)}
                      </span>
                    </div>
                    <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500/70 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Prayer Settings ── */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} className="text-orange-400" />
          <span className="text-sm font-bold text-foreground">
            Настройки намаза
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Метод расчёта</span>
            <span className="text-foreground font-medium truncate max-w-[150px] text-right">
              {prayerSettings?.calculationMethod || "Не задан"}
            </span>
          </div>
          <Separator className="bg-orange-500/10" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Мазхаб</span>
            <span className="text-foreground font-medium">
              {prayerSettings?.madhab || "Не задан"}
            </span>
          </div>
          <Separator className="bg-orange-500/10" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Globe size={12} />
              Местоположение
            </span>
            <span className="text-foreground font-medium truncate max-w-[160px] text-right">
              {prayerSettings?.locationName || "Не задано"}
            </span>
          </div>
        </div>
      </div>

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
