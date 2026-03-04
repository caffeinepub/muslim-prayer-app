import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen, Clock, Compass, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import PrayerTimesTab from "./components/PrayerTimes";
import ProfileTab, { AvatarCircle } from "./components/ProfileTab";
import QiblaCompass from "./components/QiblaCompass";
import QuranTab from "./components/QuranTab";
import RamadanTab from "./components/RamadanTab";
import TasbihTab from "./components/Tasbih";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";

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
    id: "ramadan",
    label: "Рамадан",
    icon: <CrescentIcon size={22} />,
    ocid: "nav.ramadan.tab",
    isCenter: true,
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
    id: "quran",
    label: "Коран",
    icon: <BookOpen size={20} />,
    ocid: "nav.quran.tab",
  },
  {
    id: "profile",
    label: "Профиль",
    icon: <User size={20} />,
    ocid: "nav.profile.tab",
  },
];

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("prayer");
  const { isInitializing, identity } = useInternetIdentity();
  const { user: supabaseUser, profile } = useSupabaseAuth();

  const isLoggedIn = !!identity || !!supabaseUser;

  // Derive display name for avatar
  const displayName =
    profile?.name ||
    (supabaseUser?.email ? supabaseUser.email.split("@")[0] : null) ||
    (identity ? "II" : null) ||
    "";
  const displayEmail = supabaseUser?.email || "";

  const renderTab = () => {
    switch (activeTab) {
      case "prayer":
        return <PrayerTimesTab />;
      case "qibla":
        return <QiblaCompass />;
      case "tasbih":
        return <TasbihTab />;
      case "quran":
        return <QuranTab />;
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

        {/* Auth area */}
        {isInitializing ? (
          <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
        ) : isLoggedIn ? (
          // Clickable avatar → go to profile tab
          <button
            type="button"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 rounded-full"
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
            className="h-8 w-8 text-foreground/50 hover:text-orange-400 hover:bg-orange-500/10"
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
                  onClick={() => setActiveTab(tab.id)}
                  data-ocid={tab.ocid}
                >
                  {/* Center elevated button */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 mb-0.5 ${
                      isActive
                        ? "bg-orange-500 text-white scale-105 shadow-orange-500/40"
                        : "bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25"
                    }`}
                    style={{ marginTop: "-14px" }}
                  >
                    {tab.icon}
                  </div>
                  <span
                    className={`text-[9px] font-medium transition-all duration-200 ${
                      isActive ? "text-orange-400" : "text-foreground/30"
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
