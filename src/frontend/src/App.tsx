import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen, Clock, Compass, LogOut, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import AsmaulHusna from "./components/AsmaulHusna";
import PrayerTimesTab from "./components/PrayerTimes";
import QiblaCompass from "./components/QiblaCompass";
import TasbihTab from "./components/Tasbih";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

type TabId = "prayer" | "qibla" | "tasbih" | "names";

interface NavTab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}

const TABS: NavTab[] = [
  {
    id: "prayer",
    label: "Намаз",
    icon: <Clock size={20} />,
    ocid: "nav.prayer_times.tab",
  },
  {
    id: "qibla",
    label: "Кибла",
    icon: <Compass size={20} />,
    ocid: "nav.qibla.tab",
  },
  {
    id: "tasbih",
    label: "Тасбих",
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
        aria-label="Тасбих"
        role="img"
      >
        <title>Тасбих</title>
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
    id: "names",
    label: "99 имён",
    icon: <BookOpen size={20} />,
    ocid: "nav.names.tab",
  },
];

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("prayer");
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const renderTab = () => {
    switch (activeTab) {
      case "prayer":
        return <PrayerTimesTab />;
      case "qibla":
        return <QiblaCompass />;
      case "tasbih":
        return <TasbihTab />;
      case "names":
        return <AsmaulHusna />;
      default:
        return <PrayerTimesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background islamic-pattern flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.1 0 0 / 0.97), oklch(0.1 0 0 / 0.8))",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid oklch(var(--orange-500) / 0.12)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-orange-500/20">
            <img
              src="/assets/generated/mosque-logo-transparent.dim_200x200.png"
              alt="Ислам"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-sm font-display font-bold text-gradient-orange leading-none">
              Салях
            </div>
            <div className="text-[10px] text-foreground/30 leading-none mt-0.5">
              Помощник мусульманина
            </div>
          </div>
        </div>

        {/* Auth */}
        {isInitializing ? (
          <div className="w-20 h-8 rounded-lg bg-secondary animate-pulse" />
        ) : isLoggedIn ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <User size={12} className="text-orange-400" />
              <span className="text-xs text-orange-400 font-medium">
                Войдено
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground/40 hover:text-foreground"
              onClick={clear}
              title="Выйти"
            >
              <LogOut size={14} />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-orange-400 h-8 px-3 text-xs font-semibold"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="auth.login.button"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin" />
                Вход...
              </span>
            ) : (
              "Войти"
            )}
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
            return (
              <button
                type="button"
                key={tab.id}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 focus-visible:outline-none"
                onClick={() => setActiveTab(tab.id)}
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
                    className="w-8 h-0.5 rounded-full bg-orange-500 origin-center"
                  />
                </div>

                {/* Icon */}
                <span
                  className={`transition-all duration-200 ${
                    isActive
                      ? "text-orange-400 scale-110"
                      : "text-foreground/30"
                  }`}
                >
                  {tab.icon}
                </span>

                {/* Label */}
                <span
                  className={`text-[10px] font-medium transition-all duration-200 ${
                    isActive ? "text-orange-400" : "text-foreground/30"
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
            background: "oklch(0.16 0.005 60)",
            border: "1px solid oklch(var(--orange-500) / 0.2)",
            color: "oklch(0.96 0.005 60)",
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
