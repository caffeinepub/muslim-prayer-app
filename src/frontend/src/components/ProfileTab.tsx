import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Globe,
  Loader2,
  LogOut,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetPrayerSettings,
  useGetTasbihCounters,
} from "../hooks/useQueries";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

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
    return "II";
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

function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();
  const { signInWithEmail, isEmailSent, emailError, isLoading } =
    useSupabaseAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      toast.error("Введите email адрес");
      return;
    }
    setIsSubmitting(true);
    await signInWithEmail(email.trim());
    setIsSubmitting(false);
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

      <div className="w-full max-w-sm space-y-5">
        {/* Email login section */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-orange-400" />
            <span className="text-sm font-semibold text-foreground">
              Войти по Email
            </span>
          </div>

          <AnimatePresence mode="wait">
            {isEmailSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4 text-center"
              >
                <CheckCircle2 size={40} className="text-orange-400" />
                <div>
                  <p className="font-semibold text-foreground">
                    Письмо отправлено!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Проверьте почту — мы отправили ссылку для входа на{" "}
                    <span className="text-orange-400">{email}</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleEmailLogin();
                  }}
                  className="bg-secondary/50 border-orange-500/20 focus:border-orange-500/50 text-sm h-10"
                  data-ocid="profile.email.input"
                />
                {emailError && (
                  <p
                    className="text-xs text-destructive-foreground bg-destructive/20 rounded-lg px-3 py-2"
                    data-ocid="profile.error_state"
                  >
                    {emailError}
                  </p>
                )}
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-orange-400 font-semibold h-10"
                  onClick={() => void handleEmailLogin()}
                  disabled={isSubmitting || !email.trim()}
                  data-ocid="profile.email.submit_button"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Отправка...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail size={14} />
                      Отправить ссылку
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-orange-500/15" />
          <span className="text-xs text-muted-foreground font-medium px-1">
            или
          </span>
          <Separator className="flex-1 bg-orange-500/15" />
        </div>

        {/* Internet Identity section */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-orange-400" />
            <span className="text-sm font-semibold text-foreground">
              Internet Identity
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Децентрализованный вход без пароля на базе блокчейна ICP. Ваши
            данные принадлежат только вам.
          </p>
          <Button
            variant="outline"
            className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 font-semibold h-10"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="profile.icp.button"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Вход...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield size={14} />
                Войти через ICP
              </span>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 leading-relaxed">
          Войдите, чтобы сохранять настройки намаза, тасбих и профиль между
          устройствами
        </p>
      </div>
    </motion.div>
  );
}

function ProfileScreen() {
  const { identity, clear } = useInternetIdentity();
  const {
    user: supabaseUser,
    profile,
    signOut,
    saveProfile,
    isLoading,
  } = useSupabaseAuth();
  const { data: prayerSettings } = useGetPrayerSettings();
  const { data: tasbihCounters } = useGetTasbihCounters();

  const isICP = !!identity && !supabaseUser;
  const isSupabase = !!supabaseUser;

  const displayName =
    profile?.name ||
    (supabaseUser?.email ? supabaseUser.email.split("@")[0] : null) ||
    (isICP ? "Мусульманин" : null) ||
    "";

  const displayEmail =
    supabaseUser?.email || (isICP ? "Internet Identity" : "");

  const [nameEdit, setNameEdit] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);

  const totalTasbih =
    tasbihCounters?.reduce((acc, c) => acc + Number(c.count), 0) ?? 0;

  const handleSaveName = async () => {
    if (!nameEdit.trim()) return;
    setIsSavingName(true);
    try {
      if (isSupabase) {
        await saveProfile({ name: nameEdit.trim() });
      }
      toast.success("Имя сохранено");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabase) {
      await signOut();
    } else if (isICP) {
      clear();
    }
    toast.success("Вы вышли из аккаунта");
  };

  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

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
      {/* Avatar & Identity */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <AvatarCircle name={displayName} email={displayEmail} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-lg text-foreground truncate">
              {displayName || "Гость"}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {displayEmail}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {isICP ? (
                <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 font-medium">
                  <Shield size={9} />
                  Internet Identity
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 font-medium">
                  <Mail size={9} />
                  Email
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Name edit — only for Supabase users */}
        {isSupabase && (
          <div className="space-y-2">
            <label
              htmlFor="profile-name"
              className="text-xs text-muted-foreground font-medium"
            >
              Имя
            </label>
            <div className="flex gap-2">
              <Input
                id="profile-name"
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                placeholder="Ваше имя"
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
        )}
      </div>

      {/* Prayer Settings */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={15} className="text-orange-400" />
          <span className="text-sm font-semibold text-foreground">
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

      {/* Statistics */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays size={15} className="text-orange-400" />
          <span className="text-sm font-semibold text-foreground">
            Статистика
          </span>
        </div>
        <div className="space-y-2">
          {createdAt && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Дата регистрации</span>
                <span className="text-foreground font-medium">{createdAt}</span>
              </div>
              <Separator className="bg-orange-500/10" />
            </>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Тасбих сегодня</span>
            <span className="text-orange-400 font-bold text-base">
              {totalTasbih}
            </span>
          </div>
          {tasbihCounters && tasbihCounters.length > 0 && (
            <>
              <Separator className="bg-orange-500/10" />
              <div className="space-y-1.5">
                {tasbihCounters.map((counter) => (
                  <div
                    key={counter.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">
                      {counter.name}
                    </span>
                    <span className="text-foreground">
                      {Number(counter.count)} / {Number(counter.target)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sign out */}
      <Button
        variant="destructive"
        className="w-full h-11 font-semibold mt-1"
        onClick={() => void handleSignOut()}
        data-ocid="profile.signout.button"
      >
        <LogOut size={16} className="mr-2" />
        Выйти из аккаунта
      </Button>

      {/* Footer */}
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
    </motion.div>
  );
}

export default function ProfileTab() {
  const { identity } = useInternetIdentity();
  const { user: supabaseUser } = useSupabaseAuth();

  const isLoggedIn = !!identity || !!supabaseUser;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-display font-bold text-gradient-orange">
          Профиль
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isLoggedIn
            ? "Управление аккаунтом и настройками"
            : "Войдите, чтобы сохранять прогресс"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isLoggedIn ? (
          <ProfileScreen key="logged-in" />
        ) : (
          <LoginScreen key="logged-out" />
        )}
      </AnimatePresence>
    </div>
  );
}

// Export avatar for use in App.tsx header
export { AvatarCircle };
