import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen, Clock, Compass, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import BooksTab from "./components/BooksTab";
import PrayerTimesTab from "./components/PrayerTimes";
import ProfileTab, { AvatarCircle } from "./components/ProfileTab";
import QiblaCompass from "./components/QiblaCompass";
import RamadanTab from "./components/RamadanTab";
import TasbihTab from "./components/Tasbih";
import { useFirebaseAuth } from "./hooks/useFirebaseAuth";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { tr, useLanguage } from "./hooks/useLanguage";
import { playNavTap } from "./utils/sounds";

// Splash screen component
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Radial glow — emerald */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.68 0.18 155 / 0.18) 0%, transparent 70%)",
        }}
      />

      {/* Geometric ring */}
      <motion.div
        className="absolute w-72 h-72 rounded-full border border-islamic-500/15"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.4, opacity: [0, 0.4, 0] }}
        transition={{ duration: 2.4, ease: "easeOut", delay: 0.3 }}
      />
      <motion.div
        className="absolute w-56 h-56 rounded-full border border-islamic-500/20"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
        transition={{ duration: 2.2, ease: "easeOut", delay: 0.5 }}
      />

      {/* Logo */}
      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.75, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
      >
        {/* Mosque icon with glow */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl"
            style={{
              background: "oklch(0.68 0.18 155 / 0.45)",
              transform: "scale(1.4)",
            }}
          />
          <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-islamic-500/30 shadow-2xl shadow-islamic-500/20">
            <img
              src="/assets/generated/mosque-logo-transparent.dim_200x200.png"
              alt="Пятница!"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* App name */}
        <div className="text-center space-y-1">
          <motion.div
            className="text-4xl font-display font-bold text-gradient-orange tracking-wide"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            Пятница!
          </motion.div>
          <motion.div
            className="text-sm text-foreground/40 font-medium tracking-widest uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Помощник мусульманина
          </motion.div>
        </div>

        {/* Arabic phrase */}
        <motion.div
          className="text-center space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div
            className="text-2xl text-islamic-400/80 drop-shadow-lg leading-relaxed"
            style={{ fontFamily: "serif", direction: "rtl" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
          <div className="text-xs text-muted-foreground/50">
            Во имя Аллаха, Милостивого, Милосердного
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom pulse dots */}
      <motion.div
        className="absolute bottom-16 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-islamic-500/50"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.0,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

type TabId = "prayer" | "qibla" | "tasbih" | "quran" | "ramadan" | "profile";

interface NavTab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  ocid: string;
  isCenter?: boolean;
}

// Crescent moon icon for Ramadan center button
function CrescentIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Рамадан"
      role="img"
    >
      <title>Рамадан</title>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function buildTabs(lang: import("./hooks/useLanguage").LangCode): NavTab[] {
  return [
    {
      id: "prayer",
      label: tr("nav.prayer", lang),
      icon: <Clock size={20} />,
      ocid: "nav.prayer_times.tab",
    },
    {
      id: "qibla",
      label: tr("nav.qibla", lang),
      icon: <Compass size={20} />,
      ocid: "nav.qibla.tab",
    },
    {
      id: "ramadan",
      label: tr("nav.ramadan", lang),
      icon: <CrescentIcon size={22} />,
      ocid: "nav.ramadan.tab",
      isCenter: true,
    },
    {
      id: "tasbih",
      label: tr("nav.tasbih", lang),
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label={tr("nav.tasbih", lang)}
          role="img"
        >
          <title>{tr("nav.tasbih", lang)}</title>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3c0 0 1.5 2 1.5 4.5S12 12 12 12" />
          <path d="M12 3c0 0-1.5 2-1.5 4.5S12 12 12 12" />
          <path d="M3 12c0 0 2-1.5 4.5-1.5S12 12 12 12" />
          <path d="M3 12c0 0 2 1.5 4.5 1.5S12 12 12 12" />
          <path d="M21 12c0 0-2 1.5-4.5 1.5S12 12 12 12" />
          <path d="M21 12c0 0-2-1.5-4.5-1.5S12 12 12 12" />
          <circle cx="12" cy="3" r="1.5" />
        </svg>
      ),
      ocid: "nav.tasbih.tab",
    },
    {
      id: "quran",
      label: tr("nav.books", lang),
      icon: <BookOpen size={20} />,
      ocid: "nav.quran.tab",
    },
  ];
}

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function updateUsageStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastDate = localStorage.getItem("last_usage_date");
    const streak = Number(localStorage.getItem("usage_streak") || "0");

    if (lastDate === today) return; // already counted today

    if (lastDate) {
      const last = new Date(lastDate);
      const now = new Date(today);
      const diffDays = Math.round(
        (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        // consecutive day
        localStorage.setItem("usage_streak", String(streak + 1));
      } else if (diffDays > 1) {
        // streak broken
        localStorage.setItem("usage_streak", "1");
      }
    } else {
      // first ever usage
      localStorage.setItem("usage_streak", "1");
    }
    localStorage.setItem("last_usage_date", today);
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("prayer");
  const [showSplash, setShowSplash] = useState(true);
  const { isInitializing, identity } = useInternetIdentity();
  const { user: firebaseUser, profile } = useFirebaseAuth();
  const lang = useLanguage();
  const TABS = buildTabs(lang);
  const wasLoggedIn = useRef(false);
  // splashDone: becomes true only after the splash screen finishes
  const splashDone = useRef(false);

  const isLoggedIn = !!identity || !!firebaseUser;

  // Track daily usage streak on mount
  useEffect(() => {
    updateUsageStreak();
  }, []);

  // After explicit sign-in during the session: switch to profile tab
  // But only AFTER the splash has finished (not when auth state initializes on app start)
  useEffect(() => {
    // If splash is still showing, just record current login state and do nothing
    if (!splashDone.current) {
      wasLoggedIn.current = isLoggedIn;
      return;
    }
    // After splash: if user goes from logged-out to logged-in, navigate to profile
    if (isLoggedIn && !wasLoggedIn.current) {
      setActiveTab("profile");
    }
    wasLoggedIn.current = isLoggedIn;
  }, [isLoggedIn]);

  // Derive display name for avatar
  const displayName =
    profile?.name ||
    (firebaseUser?.email ? firebaseUser.email.split("@")[0] : null) ||
    (identity ? "II" : null) ||
    "";
  const displayEmail = firebaseUser?.email || "";

  const renderTab = () => {
    switch (activeTab) {
      case "prayer":
        return <PrayerTimesTab />;
      case "qibla":
        return <QiblaCompass />;
      case "tasbih":
        return <TasbihTab />;
      case "quran":
        return <BooksTab />;
      case "ramadan":
        return <RamadanTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <PrayerTimesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background islamic-pattern flex flex-col max-w-md mx-auto relative">
      {/* Splash screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            onDone={() => {
              splashDone.current = true;
              wasLoggedIn.current = isLoggedIn;
              setActiveTab("prayer");
              setShowSplash(false);
            }}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.1 0.012 240 / 0.97), oklch(0.1 0.012 240 / 0.8))",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid oklch(var(--islamic-500) / 0.12)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-islamic-500/20">
            <img
              src="/assets/generated/mosque-logo-transparent.dim_200x200.png"
              alt="Ислам"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-sm font-display font-bold text-gradient-orange leading-none">
              Пятница!
            </div>
            <div className="text-[10px] text-foreground/30 leading-none mt-0.5">
              Помощник мусульманина
            </div>
          </div>
        </div>

        {/* Auth area */}
        {isInitializing ? (
          <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
        ) : isLoggedIn ? (
          // Clickable avatar → go to profile tab
          <button
            type="button"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-500/60 rounded-full"
            onClick={() => setActiveTab("profile")}
            title="Профиль"
            data-ocid="nav.profile.tab"
          >
            <AvatarCircle name={displayName} email={displayEmail} size="sm" />
          </button>
        ) : (
          // Not logged in: user icon → profile tab
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/50 hover:text-islamic-400 hover:bg-islamic-500/10"
            onClick={() => setActiveTab("profile")}
            title="Войти"
            data-ocid="auth.login.button"
          >
            <User size={16} />
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-20 bottom-nav">
        <div className="flex items-stretch h-16">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            if (tab.isCenter) {
              return (
                <button
                  type="button"
                  key={tab.id}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200 focus-visible:outline-none"
                  onClick={() => {
                    playNavTap();
                    setActiveTab(tab.id);
                  }}
                  data-ocid={tab.ocid}
                >
                  {/* Center highlighted button — contained within nav height */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isActive
                        ? "bg-islamic-500 text-white scale-105 shadow-islamic-500/40"
                        : "bg-islamic-500/15 text-islamic-400 border border-islamic-500/30 hover:bg-islamic-500/25"
                    }`}
                  >
                    {tab.icon}
                  </div>
                  <span
                    className={`text-[9px] font-medium transition-all duration-200 ${
                      isActive ? "text-islamic-400" : "text-foreground/30"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                type="button"
                key={tab.id}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 focus-visible:outline-none"
                onClick={() => {
                  playNavTap();
                  setActiveTab(tab.id);
                }}
                data-ocid={tab.ocid}
              >
                {/* Active indicator */}
                <div className="absolute top-0 inset-x-0 flex justify-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scaleX: isActive ? 1 : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="w-8 h-0.5 rounded-full bg-islamic-500 origin-center"
                  />
                </div>

                {/* Icon */}
                <span
                  className={`transition-all duration-200 ${
                    isActive
                      ? "text-islamic-400 scale-110"
                      : "text-foreground/30"
                  }`}
                >
                  {tab.icon}
                </span>

                {/* Label */}
                <span
                  className={`text-[10px] font-medium transition-all duration-200 ${
                    isActive ? "text-islamic-400" : "text-foreground/30"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toaster */}
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.16 0.014 240)",
            border: "1px solid oklch(var(--islamic-500) / 0.2)",
            color: "oklch(0.96 0.006 80)",
          },
        }}
      />

      {/* Footer */}
      <div className="hidden">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Built with love using caffeine.ai
        </a>
      </div>
    </div>
  );
}
