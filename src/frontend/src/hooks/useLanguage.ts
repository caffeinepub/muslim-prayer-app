import { useEffect, useState } from "react";

export type LangCode = "ru" | "en" | "ar";

const LANG_KEY = "app_language";

// Global subscribers for cross-component reactivity
const subscribers = new Set<() => void>();
let currentLang: LangCode =
  (localStorage.getItem(LANG_KEY) as LangCode) || "ru";

export function setAppLanguage(code: LangCode) {
  currentLang = code;
  localStorage.setItem(LANG_KEY, code);
  for (const fn of subscribers) fn();
}

export function getAppLanguage(): LangCode {
  return currentLang;
}

export function useLanguage(): LangCode {
  const [lang, setLang] = useState<LangCode>(currentLang);

  useEffect(() => {
    const update = () => setLang(currentLang);
    subscribers.add(update);
    return () => {
      subscribers.delete(update);
    };
  }, []);

  return lang;
}

// ─── Translation map ──────────────────────────────────────────────────────────
type TranslationMap = Record<string, Partial<Record<LangCode, string>>>;

export const t: TranslationMap = {
  // Navigation
  "nav.prayer": { ru: "Намаз", en: "Prayer", ar: "الصلاة" },
  "nav.qibla": { ru: "Кибла", en: "Qibla", ar: "القبلة" },
  "nav.ramadan": { ru: "Рамадан", en: "Ramadan", ar: "رمضان" },
  "nav.tasbih": { ru: "Тасбих", en: "Tasbih", ar: "التسبيح" },
  "nav.books": { ru: "Книги", en: "Books", ar: "الكتب" },

  // Prayer times
  "prayer.title": {
    ru: "Времена намаза",
    en: "Prayer Times",
    ar: "أوقات الصلاة",
  },
  "prayer.fajr": { ru: "Фаджр", en: "Fajr", ar: "الفجر" },
  "prayer.sunrise": { ru: "Восход", en: "Sunrise", ar: "الشروق" },
  "prayer.dhuhr": { ru: "Зухр", en: "Dhuhr", ar: "الظهر" },
  "prayer.asr": { ru: "Аср", en: "Asr", ar: "العصر" },
  "prayer.maghrib": { ru: "Магриб", en: "Maghrib", ar: "المغرب" },
  "prayer.isha": { ru: "Иша", en: "Isha", ar: "العشاء" },

  // Profile
  "profile.title": { ru: "Профиль", en: "Profile", ar: "الملف الشخصي" },
  "profile.signout": {
    ru: "Выйти из аккаунта",
    en: "Sign Out",
    ar: "تسجيل الخروج",
  },
  "profile.language": { ru: "Язык", en: "Language", ar: "اللغة" },
  "profile.notifications": {
    ru: "Уведомления",
    en: "Notifications",
    ar: "الإشعارات",
  },
  "profile.prayer_guide": {
    ru: "Намаз для начинающих",
    en: "Prayer for Beginners",
    ar: "الصلاة للمبتدئين",
  },
  "profile.today_prayer": { ru: "Намаз", en: "Today Prayer", ar: "صلاة اليوم" },

  // Ramadan
  "ramadan.title": { ru: "Рамадан", en: "Ramadan", ar: "رمضان" },
  "ramadan.iftar": { ru: "Ифтар", en: "Iftar", ar: "إفطار" },
  "ramadan.suhur": { ru: "Сухур", en: "Suhur", ar: "سحور" },

  // Qibla
  "qibla.title": {
    ru: "Компас Киблы",
    en: "Qibla Compass",
    ar: "بوصلة القبلة",
  },
  "qibla.mecca": { ru: "Мекка", en: "Mecca", ar: "مكة المكرمة" },

  // Tasbih
  "tasbih.title": { ru: "Тасбих", en: "Tasbih", ar: "التسبيح" },
  "tasbih.count": {
    ru: "Нажмите для подсчёта",
    en: "Tap to count",
    ar: "اضغط للعد",
  },

  // Books
  "books.title": { ru: "Книги", en: "Books", ar: "الكتب" },
  "books.quran": {
    ru: "Священный Коран",
    en: "The Holy Quran",
    ar: "القرآن الكريم",
  },

  // Prayer guide
  "guide.title": {
    ru: "Намаз для начинающих",
    en: "Prayer for Beginners",
    ar: "الصلاة للمبتدئين",
  },
  "guide.back": { ru: "Назад", en: "Back", ar: "رجوع" },
  "guide.next": { ru: "Далее", en: "Next", ar: "التالي" },

  // Common
  "common.save": { ru: "Сохранить", en: "Save", ar: "حفظ" },
  "common.search": { ru: "Поиск", en: "Search", ar: "بحث" },
};

/**
 * Get a translated string by key. Falls back to Russian if language not found.
 */
export function tr(key: string, lang: LangCode): string {
  const entry = t[key];
  if (!entry) return key;
  return entry[lang] || entry.ru || key;
}
