import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { type Surah, quranSurahs } from "../data/quranSurahs";
import { type LangCode, tr, useLanguage } from "../hooks/useLanguage";
import { playBookOpen } from "../utils/sounds";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Ayah {
  number: number;
  arabic: string;
  translation: string;
}

interface BukhariHadith {
  number: number;
  chapter: string;
  arabic: string;
  translation: string;
  narrator: string;
}

interface BukhariChapter {
  id: number;
  title: string;
  titleArabic: string;
  hadiths: BukhariHadith[];
}

// ─────────────────────────────────────────────
// Quran full-text ayahs (same as before)
// ─────────────────────────────────────────────
const surahTexts: Record<number, Ayah[]> = {
  1: [
    {
      number: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "Во имя Аллаха, Милостивого, Милосердного!",
    },
    {
      number: 2,
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "Хвала Аллаху, Господу миров,",
    },
    {
      number: 3,
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "Милостивому, Милосердному,",
    },
    {
      number: 4,
      arabic: "مَالِكِ يَوْمِ الدِّينِ",
      translation: "Владыке Дня воздаяния!",
    },
    {
      number: 5,
      arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translation: "Тебе одному мы поклоняемся и Тебя одного молим о помощи.",
    },
    {
      number: 6,
      arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translation: "Веди нас прямым путём,",
    },
    {
      number: 7,
      arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      translation:
        "путём тех, кого Ты облагодетельствовал, не тех, на кого Ты разгневался, и не заблудших.",
    },
  ],
  112: [
    {
      number: 1,
      arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translation: "Скажи: «Он — Аллах Единый,",
    },
    { number: 2, arabic: "اللَّهُ الصَّمَدُ", translation: "Аллах Вечный." },
    {
      number: 3,
      arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
      translation: "Он не родил и не был рождён,",
    },
    {
      number: 4,
      arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
      translation: "и нет никого равного Ему».",
    },
  ],
  113: [
    {
      number: 1,
      arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
      translation: "Скажи: «Прибегаю к защите Господа рассвета",
    },
    {
      number: 2,
      arabic: "مِن شَرِّ مَا خَلَقَ",
      translation: "от зла того, что Он сотворил,",
    },
    {
      number: 3,
      arabic: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
      translation: "от зла мрака, когда он наступает,",
    },
    {
      number: 4,
      arabic: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
      translation: "от зла колдуний, дующих на узлы,",
    },
    {
      number: 5,
      arabic: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      translation: "от зла завистника, когда он завидует».",
    },
  ],
  114: [
    {
      number: 1,
      arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
      translation: "Скажи: «Прибегаю к защите Господа людей,",
    },
    { number: 2, arabic: "مَلِكِ النَّاسِ", translation: "Царя людей," },
    { number: 3, arabic: "إِلَٰهِ النَّاسِ", translation: "Бога людей," },
    {
      number: 4,
      arabic: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
      translation: "от зла искусителя исчезающего,",
    },
    {
      number: 5,
      arabic: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
      translation: "который нашёптывает в груди людей,",
    },
    {
      number: 6,
      arabic: "مِنَ الْجِنَّةِ وَالنَّاسِ",
      translation: "будь то джинны или люди».",
    },
  ],
};

// ─────────────────────────────────────────────
// Multi-language ayah translations (for surahs with full text)
// ─────────────────────────────────────────────
type AyahTranslations = Record<
  number,
  Record<number, Partial<Record<LangCode, string>>>
>;

const surahTranslations: AyahTranslations = {
  1: {
    1: {
      en: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    },
    2: {
      en: "[All] praise is [due] to Allah, Lord of the worlds.",
      ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    },
    3: {
      en: "The Entirely Merciful, the Especially Merciful.",
      ar: "الرَّحْمَٰنِ الرَّحِيمِ",
    },
    4: {
      en: "Sovereign of the Day of Recompense.",
      ar: "مَالِكِ يَوْمِ الدِّينِ",
    },
    5: {
      en: "It is You we worship and You we ask for help.",
      ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    },
    6: {
      en: "Guide us to the straight path.",
      ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    },
    7: {
      en: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
      ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    },
  },
  112: {
    1: {
      en: "Say: He is Allah, [who is] One.",
      ar: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    },
    2: {
      en: "Allah, the Eternal Refuge.",
      ar: "اللَّهُ الصَّمَدُ",
    },
    3: {
      en: "He neither begets nor is born.",
      ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    },
    4: {
      en: "Nor is there to Him any equivalent.",
      ar: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
    },
  },
  113: {
    1: {
      en: "Say: I seek refuge in the Lord of daybreak.",
      ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
    },
    2: {
      en: "From the evil of what He has created.",
      ar: "مِن شَرِّ مَا خَلَقَ",
    },
    3: {
      en: "And from the evil of darkness when it settles.",
      ar: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    },
    4: {
      en: "And from the evil of the blowers in knots.",
      ar: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
    },
    5: {
      en: "And from the evil of an envier when he envies.",
      ar: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    },
  },
  114: {
    1: {
      en: "Say: I seek refuge in the Lord of mankind.",
      ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    },
    2: {
      en: "The Sovereign of mankind.",
      ar: "مَلِكِ النَّاسِ",
    },
    3: {
      en: "The God of mankind.",
      ar: "إِلَٰهِ النَّاسِ",
    },
    4: {
      en: "From the evil of the retreating whisperer.",
      ar: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
    },
    5: {
      en: "Who whispers in the breasts of mankind.",
      ar: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
    },
    6: {
      en: "Of jinn and mankind.",
      ar: "مِنَ الْجِنَّةِ وَالنَّاسِ",
    },
  },
};

function getAyahTranslation(
  surahNum: number,
  ayahNum: number,
  lang: LangCode,
): string | null {
  // Arabic — no translation shown
  if (lang === "ar") return null;
  const surah = surahTranslations[surahNum];
  if (!surah) return lang === "en" ? null : "";
  const ayah = surah[ayahNum];
  if (!ayah) return lang === "en" ? null : "";
  return ayah[lang] || null;
}

// ─────────────────────────────────────────────
// Сахих аль-Бухари — главы и хадисы
// ─────────────────────────────────────────────
const bukhariChapters: BukhariChapter[] = [
  {
    id: 1,
    title: "Книга Откровения",
    titleArabic: "كتاب بدء الوحي",
    hadiths: [
      {
        number: 1,
        chapter: "Книга Откровения",
        arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        translation:
          "Поистине, дела оцениваются по намерениям, и каждый человек получит то, что намеревался. Тот, кто переселился ради Аллаха и Его Посланника, его переселение — ради Аллаха и Его Посланника. Тот же, кто переселился ради мирского или ради женщины, на которой хотел жениться, его переселение — ради того, ради чего он переселился.",
        narrator: "Умар ибн аль-Хаттаб (да будет доволен им Аллах)",
      },
      {
        number: 2,
        chapter: "Книга Откровения",
        arabic: "أَوَّلُ مَا بُدِئَ بِهِ رَسُولُ اللَّهِ ﷺ مِنَ الوَحْيِ الرُّؤْيَا الصَّالِحَةُ فِي النَّوْمِ",
        translation:
          "Первое, с чего началось откровение Посланника Аллаха ﷺ, — правдивые видения во сне. Он не видел ни одного сна, который бы не сбылся, подобно ясному рассвету. Затем ему была внушена любовь к уединению, и он удалялся в пещеру Хира...",
        narrator: "Аиша (да будет доволен ею Аллах)",
      },
    ],
  },
  {
    id: 2,
    title: "Книга Веры",
    titleArabic: "كتاب الإيمان",
    hadiths: [
      {
        number: 8,
        chapter: "Книга Веры",
        arabic:
          "بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَالحَجِّ، وَصَوْمِ رَمَضَانَ",
        translation:
          "Ислам построен на пяти столпах: свидетельстве того, что нет божества, кроме Аллаха, и что Мухаммад — Посланник Аллаха; совершении молитвы; выплате закята; хадже; и соблюдении поста в Рамадане.",
        narrator: "Ибн Умар (да будет доволен им Аллах)",
      },
      {
        number: 9,
        chapter: "Книга Веры",
        arabic: "أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لَا إِلَهَ إِلَّا اللَّهُ",
        translation:
          "Мне велено сражаться с людьми до тех пор, пока они не засвидетельствуют, что нет божества, кроме Аллаха, и не уверуют в меня и в то, с чем я пришёл. Когда они сделают это, их жизнь и имущество будут под защитой, за исключением случаев, когда того требует право Ислама. Их отчёт — у Аллаха.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
      {
        number: 11,
        chapter: "Книга Веры",
        arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        translation:
          "Не уверует никто из вас до тех пор, пока не полюбит для своего брата то, что любит для себя самого.",
        narrator: "Анас ибн Малик (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 3,
    title: "Книга Знания",
    titleArabic: "كتاب العلم",
    hadiths: [
      {
        number: 71,
        chapter: "Книга Знания",
        arabic: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ",
        translation:
          "Тому, кому Аллах желает блага, Он даёт глубокое понимание религии.",
        narrator: "Муавия (да будет доволен им Аллах)",
      },
      {
        number: 73,
        chapter: "Книга Знания",
        arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ",
        translation:
          "Лучший из вас тот, кто изучает Коран и обучает ему других.",
        narrator: "Усман ибн Аффан (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 4,
    title: "Книга Омовения (Вуду)",
    titleArabic: "كتاب الوضوء",
    hadiths: [
      {
        number: 135,
        chapter: "Книга Омовения",
        arabic: "لَا تُقْبَلُ صَلَاةُ مَنْ أَحْدَثَ حَتَّى يَتَوَضَّأَ",
        translation:
          "Намаз того, кто осквернился (нарушил омовение), не принимается до тех пор, пока он не совершит омовение.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
      {
        number: 136,
        chapter: "Книга Омовения",
        arabic:
          "إِذَا تَوَضَّأَ الْعَبْدُ الْمُسْلِمُ أَوِ الْمُؤْمِنُ فَغَسَلَ وَجْهَهُ خَرَجَ مِنْ وَجْهِهِ كُلُّ خَطِيئَةٍ نَظَرَ إِلَيْهَا بِعَيْنَيْهِ مَعَ الْمَاءِ",
        translation:
          "Когда мусульманин или верующий раб (Аллаха) совершает омовение и умывает лицо, вместе с водой уходят все грехи его лица — все, на что взирали его глаза. Когда он омывает руки, уходят все грехи рук. Когда омывает ноги — уходят все грехи ног, пока он не выйдет [из омовения] чистым от грехов.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 5,
    title: "Книга Молитвы",
    titleArabic: "كتاب الصلاة",
    hadiths: [
      {
        number: 350,
        chapter: "Книга Молитвы",
        arabic:
          "الصَّلَاةُ عِمَادُ الدِّينِ، فَمَنْ أَقَامَهَا فَقَدْ أَقَامَ الدِّينَ، وَمَنْ هَدَمَهَا فَقَدْ هَدَمَ الدِّينَ",
        translation:
          "Намаз — это столп религии. Тот, кто совершает его — воздвигает религию. Тот, кто оставляет его — разрушает религию.",
        narrator: "Муаз ибн Джабаль (да будет доволен им Аллах)",
      },
      {
        number: 352,
        chapter: "Книга Молитвы",
        arabic: "أَوَّلُ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ الصَّلَاةُ",
        translation:
          "Первое, за что будет держать ответ раб (Аллаха) в День Воскресения, — это намаз. Если он окажется в порядке, то и остальные его дела будут в порядке. Если же он окажется испорченным, то и остальные его дела будут испорчены.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 6,
    title: "Книга Поста",
    titleArabic: "كتاب الصوم",
    hadiths: [
      {
        number: 1894,
        chapter: "Книга Поста",
        arabic: "مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ",
        translation:
          "Тому, кто постился в Рамадан с верой и надеждой на награду, прощаются его прежние грехи.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
      {
        number: 1895,
        chapter: "Книга Поста",
        arabic:
          "الصِّيَامُ جُنَّةٌ، فَلَا يَرْفُثْ وَلَا يَجْهَلْ، وَإِنِ امْرُؤٌ قَاتَلَهُ أَوْ شَاتَمَهُ فَلْيَقُلْ: إِنِّي صَائِمٌ",
        translation:
          "Пост — это щит. Поэтому постящийся не должен говорить непристойностей и не должен вести себя невежественно. Если же кто-то нападёт на него или станет его оскорблять, пусть скажет: «Я пощусь!»",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
      {
        number: 1904,
        chapter: "Книга Поста",
        arabic: "كُلُّ عَمَلِ ابْنِ آدَمَ لَهُ إِلَّا الصِّيَامَ، فَإِنَّهُ لِي وَأَنَا أَجْزِي بِهِ",
        translation:
          "Все деяния сына Адама принадлежат ему, кроме поста — он принадлежит Мне, и Я воздам за него. Пост — это щит...",
        narrator: "Абу Хурайра (да будет доволен им Аллах) — хадис кудси",
      },
    ],
  },
  {
    id: 7,
    title: "Книга Торговли",
    titleArabic: "كتاب البيوع",
    hadiths: [
      {
        number: 2072,
        chapter: "Книга Торговли",
        arabic: "التَّاجِرُ الصَّدُوقُ الأَمِينُ مَعَ النَّبِيِّينَ وَالصِّدِّيقِينَ وَالشُّهَدَاءِ",
        translation:
          "Честный и надёжный торговец (будет воскрешен) вместе с пророками, правдивыми и мучениками (в День Воскресения).",
        narrator: "Абу Саид аль-Худри (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 8,
    title: "Книга Нравственности",
    titleArabic: "كتاب الأدب",
    hadiths: [
      {
        number: 5763,
        chapter: "Книга Нравственности",
        arabic: "أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا",
        translation:
          "Наиболее совершенный по вере среди верующих — тот, у кого лучший нрав.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
      {
        number: 5765,
        chapter: "Книга Нравственности",
        arabic: "إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ وَأَقْرَبِكُمْ مِنِّي مَجْلِسًا يَوْمَ الْقِيَامَةِ أَحَاسِنَكُمْ أَخْلَاقًا",
        translation:
          "Поистине, самые любимые мне из вас и ближайшие ко мне в День Воскресения по месту — те из вас, у кого лучший нрав.",
        narrator: "Джабир ибн Абдуллах (да будет доволен им Аллах)",
      },
      {
        number: 5778,
        chapter: "Книга Нравственности",
        arabic: "الْبِرُّ حُسْنُ الْخُلُقِ",
        translation: "Благочестие — это хороший нрав.",
        narrator: "ан-Ниввас ибн Самъан (да будет доволен им Аллах)",
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Quran components (reused from QuranTab)
// ─────────────────────────────────────────────
function SurahOrnament({ name }: { name: string }) {
  return (
    <div className="relative flex items-center justify-center w-full mb-1">
      <div
        className="relative w-full flex items-center justify-center py-3 px-4 rounded-lg overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 100%)",
          border: "2px solid #66bb6a",
          boxShadow: "0 2px 8px rgba(76,175,80,0.15)",
        }}
      >
        <svg
          role="img"
          aria-label="Орнамент"
          className="absolute left-2 top-1/2 -translate-y-1/2"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
        >
          <circle cx="18" cy="18" r="5" fill="#4caf50" opacity="0.4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx={18 + 10 * Math.cos((deg * Math.PI) / 180)}
              cy={18 + 10 * Math.sin((deg * Math.PI) / 180)}
              rx="4"
              ry="2.5"
              transform={`rotate(${deg} ${18 + 10 * Math.cos((deg * Math.PI) / 180)} ${18 + 10 * Math.sin((deg * Math.PI) / 180)})`}
              fill="#66bb6a"
              opacity="0.5"
            />
          ))}
        </svg>
        <svg
          role="img"
          aria-label="Орнамент"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
        >
          <circle cx="18" cy="18" r="5" fill="#4caf50" opacity="0.4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx={18 + 10 * Math.cos((deg * Math.PI) / 180)}
              cy={18 + 10 * Math.sin((deg * Math.PI) / 180)}
              rx="4"
              ry="2.5"
              transform={`rotate(${deg} ${18 + 10 * Math.cos((deg * Math.PI) / 180)} ${18 + 10 * Math.sin((deg * Math.PI) / 180)})`}
              fill="#66bb6a"
              opacity="0.5"
            />
          ))}
        </svg>
        <div className="absolute left-12 right-12 top-1 h-px bg-green-600/30" />
        <div className="absolute left-12 right-12 bottom-1 h-px bg-green-600/30" />
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: "serif", direction: "rtl", color: "#1a3c1a" }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function AyahMedallion({ number }: { number: number }) {
  return (
    <div className="flex-shrink-0 w-8 h-8 relative flex items-center justify-center">
      <svg
        role="img"
        aria-label="Номер аята"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <polygon
          points="16,1 20,11 31,11 22,18 25,29 16,22 7,29 10,18 1,11 12,11"
          fill="none"
          stroke="#4caf50"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <circle
          cx="16"
          cy="16"
          r="8"
          fill="none"
          stroke="#4caf50"
          strokeWidth="0.8"
          opacity="0.4"
        />
      </svg>
      <span
        className="absolute text-[9px] font-bold"
        style={{ color: "#2e7d32" }}
      >
        {number}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Quran reading view
// ─────────────────────────────────────────────
function SurahReadingView({
  surah,
  onBack,
}: { surah: Surah; onBack: () => void }) {
  const lang = useLanguage();
  const ayahs = surahTexts[surah.number];
  const hasFullText = !!ayahs;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#faf8f0" }}
      data-ocid="quran.reading.panel"
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#faf8f0",
          borderBottom: "1px solid rgba(76,175,80,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#2e7d32" }}
          onClick={onBack}
          data-ocid="quran.reading.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: "#2e7d32" }}>
            {surah.number}. {surah.nameRu}
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-5 pb-24">
        <SurahOrnament name={surah.arabic} />
        {surah.number !== 1 && surah.number !== 9 && (
          <div
            className="text-center text-2xl my-6 leading-loose"
            style={{ fontFamily: "serif", direction: "rtl", color: "#1a1a1a" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              background: "rgba(76,175,80,0.12)",
              color: "#2e7d32",
              border: "1px solid rgba(76,175,80,0.25)",
            }}
          >
            {surah.place}
          </span>
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              background: "rgba(76,175,80,0.12)",
              color: "#2e7d32",
              border: "1px solid rgba(76,175,80,0.25)",
            }}
          >
            {surah.verses} аятов
          </span>
        </div>
        {hasFullText ? (
          <div className="space-y-0">
            {ayahs.map((ayah, idx) => (
              <div
                key={ayah.number}
                className="py-4"
                style={{
                  borderBottom:
                    idx < ayahs.length - 1
                      ? "1px solid rgba(76,175,80,0.12)"
                      : "none",
                }}
                data-ocid={`quran.ayah.item.${ayah.number}`}
              >
                <div
                  className="flex items-start gap-2 justify-end mb-2"
                  style={{ direction: "rtl" }}
                >
                  <p
                    className="text-right leading-loose flex-1"
                    style={{
                      fontFamily: "serif",
                      fontSize: "1.5rem",
                      color: "#1a1a1a",
                      lineHeight: "2.2",
                    }}
                  >
                    {ayah.arabic}
                  </p>
                  <div className="mt-2 flex-shrink-0">
                    <AyahMedallion number={ayah.number} />
                  </div>
                </div>
                {lang !== "ar" &&
                  (() => {
                    const translation =
                      lang === "ru"
                        ? ayah.translation
                        : (getAyahTranslation(
                            surah.number,
                            ayah.number,
                            lang,
                          ) ?? ayah.translation);
                    return (
                      <p
                        className="text-sm leading-relaxed mt-1"
                        style={{ color: "#5a5a5a", lineHeight: "1.7" }}
                      >
                        <span
                          style={{
                            color: "#4caf50",
                            fontWeight: 600,
                            marginRight: "4px",
                          }}
                        >
                          {ayah.number}.
                        </span>
                        {translation}
                      </p>
                    );
                  })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(76,175,80,0.07)",
                border: "1px solid rgba(76,175,80,0.2)",
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#4caf50" }}
              >
                О суре
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                {surah.descriptionRu}
              </p>
            </div>
            <div
              className="text-center py-8"
              style={{
                fontFamily: "serif",
                direction: "rtl",
                fontSize: "3rem",
                color: "#1a3c1a",
              }}
            >
              {surah.arabic}
            </div>
            <div
              className="text-center text-sm rounded-2xl py-4 px-5"
              style={{
                background: "rgba(76,175,80,0.07)",
                border: "1px dashed rgba(76,175,80,0.3)",
                color: "#666",
              }}
            >
              Полный текст этой суры содержит {surah.verses} аятов.
              <br />
              <span style={{ color: "#4caf50" }}>
                Скоро будет добавлен полный текст.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Quran book view (list of all surahs)
// ─────────────────────────────────────────────
function QuranBookView({ onBack }: { onBack: () => void }) {
  const lang = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return quranSurahs;
    return quranSurahs.filter(
      (s) =>
        s.nameRu.toLowerCase().includes(q) ||
        s.transliteration.toLowerCase().includes(q) ||
        s.arabic.includes(q) ||
        String(s.number).includes(q),
    );
  }, [search]);

  if (selectedSurah) {
    return (
      <SurahReadingView
        surah={selectedSurah}
        onBack={() => setSelectedSurah(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#faf8f0" }}
      data-ocid="quran.book.panel"
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#faf8f0",
          borderBottom: "1px solid rgba(76,175,80,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#2e7d32" }}
          onClick={onBack}
          data-ocid="books.quran.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: "#1a3c1a" }}>
            {lang === "ar"
              ? "القرآن الكريم"
              : lang === "en"
                ? "The Holy Quran"
                : "Священный Коран"}
          </div>
          <div className="text-xs" style={{ color: "#4caf50" }}>
            114 сур
          </div>
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 px-4 py-4 pb-24">
        {/* Arabic header */}
        <div className="text-center mb-4">
          <div
            className="text-2xl text-green-800/50"
            style={{ fontFamily: "serif", direction: "rtl" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#4caf50" }}
          />
          <Input
            placeholder="Поиск суры..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm border"
            style={{
              background: "rgba(76,175,80,0.06)",
              borderColor: "rgba(76,175,80,0.25)",
              color: "#1a1a1a",
            }}
            data-ocid="quran.search_input"
          />
        </div>
        <div className="text-xs mb-3 text-right" style={{ color: "#4caf50" }}>
          {filtered.length} из 114 сур
        </div>
        {/* List */}
        <div className="space-y-2">
          {filtered.map((surah) => (
            <button
              type="button"
              key={surah.number}
              className="w-full rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 text-left"
              style={{
                background: "rgba(76,175,80,0.06)",
                border: "1px solid rgba(76,175,80,0.15)",
              }}
              onClick={() => {
                playBookOpen();
                setSelectedSurah(surah);
              }}
              data-ocid={`quran.surah.item.${surah.number}`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(76,175,80,0.15)",
                  border: "1px solid rgba(76,175,80,0.3)",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#2e7d32" }}
                >
                  {surah.number}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {lang !== "ar" && (
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "#1a3c1a" }}
                    >
                      {surah.nameRu}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 shrink-0"
                    style={{
                      borderColor: "rgba(76,175,80,0.3)",
                      color: "#4caf50",
                    }}
                  >
                    {surah.place}
                  </Badge>
                </div>
                {lang !== "ar" && (
                  <div className="text-xs" style={{ color: "#5a5a5a" }}>
                    {surah.transliteration} · {surah.verses} аятов
                  </div>
                )}
                {lang === "ar" && (
                  <div className="text-xs" style={{ color: "#5a5a5a" }}>
                    {surah.verses} آية
                  </div>
                )}
              </div>
              <div
                className="text-lg font-bold shrink-0"
                style={{
                  fontFamily: "serif",
                  direction: "rtl",
                  color: "#2e7d32",
                }}
              >
                {surah.arabic}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Bukhari chapter view
// ─────────────────────────────────────────────
function BukhariChapterView({
  chapter,
  onBack,
}: { chapter: BukhariChapter; onBack: () => void }) {
  const lang = useLanguage();
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#fdfaf3" }}
      data-ocid="bukhari.chapter.panel"
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#fdfaf3",
          borderBottom: "1px solid rgba(180,130,40,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#7b5c10" }}
          onClick={onBack}
          data-ocid="bukhari.chapter.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-xs font-bold" style={{ color: "#7b5c10" }}>
            {chapter.title}
          </div>
          <div
            className="text-xs"
            style={{ color: "#b8922a", fontFamily: "serif", direction: "rtl" }}
          >
            {chapter.titleArabic}
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-5 pb-24 space-y-5">
        {chapter.hadiths.map((hadith, idx) => (
          <div
            key={hadith.number}
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(180,130,40,0.2)",
              boxShadow: "0 2px 8px rgba(180,130,40,0.06)",
            }}
            data-ocid={`bukhari.hadith.item.${idx + 1}`}
          >
            {/* Hadith header */}
            <div
              className="px-4 py-2 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #f9f0d8, #f0e4bb)",
              }}
            >
              <span className="text-xs font-bold" style={{ color: "#7b5c10" }}>
                Хадис № {hadith.number}
              </span>
              <span className="text-xs" style={{ color: "#b8922a" }}>
                {hadith.chapter}
              </span>
            </div>
            {/* Arabic text */}
            <div className="px-4 py-4" style={{ background: "#fdfaf3" }}>
              <p
                className="text-right leading-loose text-lg mb-3"
                style={{
                  fontFamily: "serif",
                  direction: "rtl",
                  color: "#1a1a1a",
                  lineHeight: "2",
                }}
              >
                {hadith.arabic}
              </p>
              {/* Divider + Translation + Narrator (hidden for Arabic) */}
              {lang !== "ar" && (
                <>
                  <div
                    className="h-px mb-3"
                    style={{ background: "rgba(180,130,40,0.15)" }}
                  />
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#444", lineHeight: "1.75" }}
                  >
                    {hadith.translation}
                  </p>
                  <div
                    className="mt-3 pt-2"
                    style={{ borderTop: "1px solid rgba(180,130,40,0.12)" }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#b8922a" }}
                    >
                      {lang === "en" ? "Narrator: " : "Передатчик: "}
                    </span>
                    <span className="text-xs" style={{ color: "#666" }}>
                      {hadith.narrator}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Bukhari book view (list of chapters)
// ─────────────────────────────────────────────
function BukhariBookView({ onBack }: { onBack: () => void }) {
  const lang = useLanguage();
  const [selectedChapter, setSelectedChapter] = useState<BukhariChapter | null>(
    null,
  );

  if (selectedChapter) {
    return (
      <BukhariChapterView
        chapter={selectedChapter}
        onBack={() => setSelectedChapter(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#fdfaf3" }}
      data-ocid="bukhari.book.panel"
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#fdfaf3",
          borderBottom: "1px solid rgba(180,130,40,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#7b5c10" }}
          onClick={onBack}
          data-ocid="books.bukhari.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: "#1a1209" }}>
            Сахих аль-Бухари
          </div>
          <div className="text-xs" style={{ color: "#b8922a" }}>
            صحيح البخاري
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-4 pb-24">
        {/* Header info */}
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "linear-gradient(135deg, #f9f0d8, #f0e4bb)",
            border: "1px solid rgba(180,130,40,0.3)",
          }}
        >
          <div
            className="text-center text-2xl mb-2"
            style={{ fontFamily: "serif", direction: "rtl", color: "#7b5c10" }}
          >
            صحيح البخاري
          </div>
          <p
            className="text-xs text-center"
            style={{ color: "#7b5c10", lineHeight: "1.6" }}
          >
            Сборник хадисов имама Мухаммада аль-Бухари (810–870 г. н.э.) — один
            из самых достоверных сборников хадисов в исламе.
          </p>
        </div>
        {/* Chapter list */}
        <div className="space-y-2">
          {bukhariChapters.map((chapter, idx) => (
            <button
              type="button"
              key={chapter.id}
              className="w-full rounded-xl px-4 py-4 flex items-center gap-3 transition-all duration-200 text-left"
              style={{
                background: "rgba(180,130,40,0.06)",
                border: "1px solid rgba(180,130,40,0.15)",
              }}
              onClick={() => {
                playBookOpen();
                setSelectedChapter(chapter);
              }}
              data-ocid={`bukhari.chapter.item.${idx + 1}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #f9f0d8, #e8d08a)",
                  border: "1px solid rgba(180,130,40,0.3)",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#7b5c10" }}
                >
                  {chapter.id}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-sm"
                  style={{ color: "#1a1209" }}
                >
                  {chapter.title}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{
                    color: "#b8922a",
                    fontFamily: "serif",
                    direction: "rtl",
                  }}
                >
                  {chapter.titleArabic}
                </div>
                <div className="text-xs mt-1" style={{ color: "#888" }}>
                  {chapter.hadiths.length}{" "}
                  {chapter.hadiths.length === 1
                    ? "хадис"
                    : chapter.hadiths.length < 5
                      ? "хадиса"
                      : "хадисов"}
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#b8922a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 40 хадисов ан-Навави
// ─────────────────────────────────────────────
interface NawawiHadith {
  number: number;
  arabic: string;
  translation: string;
  narrator: string;
  topic: string;
}

const nawawiHadiths: NawawiHadith[] = [
  {
    number: 1,
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    translation:
      "Поистине, дела оцениваются лишь по намерениям, и каждому человеку — лишь то, что он намеревался.",
    narrator: "Умар ибн аль-Хаттаб (да будет доволен им Аллах)",
    topic: "Намерение",
  },
  {
    number: 2,
    arabic: "الإِسْلَامُ أَنْ تَشْهَدَ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
    translation:
      "Ислам — это засвидетельствовать, что нет бога, кроме Аллаха, и что Мухаммад — Посланник Аллаха; совершать молитву; выплачивать закят; поститься в Рамадан; и совершить хадж к Дому (Каабе), если есть возможность.",
    narrator: "Умар ибн аль-Хаттаб (да будет доволен им Аллах)",
    topic: "Столпы ислама",
  },
  {
    number: 3,
    arabic: "بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ",
    translation:
      "Ислам построен на пяти столпах: свидетельстве того, что нет бога, кроме Аллаха, и что Мухаммад — Его раб и посланник; совершении молитвы; выплате закята; паломничестве к Дому; и посте в Рамадан.",
    narrator: "Ибн Умар (да будет доволен им Аллах)",
    topic: "Пять столпов",
  },
  {
    number: 4,
    arabic: "إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا",
    translation:
      "Каждый из вас создаётся в утробе матери в течение сорока дней в виде семени, затем столько же дней — в виде сгустка крови, затем столько же — в виде кусочка мяса, после чего к нему посылается ангел и вдыхает в него дух.",
    narrator: "Абдуллах ибн Масуд (да будет доволен им Аллах)",
    topic: "Сотворение человека",
  },
  {
    number: 5,
    arabic: "مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ",
    translation:
      "Кто введёт в наше дело что-либо, чего в нём нет, то это будет отвергнуто.",
    narrator: "Аиша (да будет доволен ею Аллах)",
    topic: "Нововведения",
  },
  {
    number: 6,
    arabic: "الحَلَالُ بَيِّنٌ وَالحَرَامُ بَيِّنٌ",
    translation:
      "Дозволенное очевидно, и запрещённое очевидно, а между ними — сомнительные вещи, о которых многие люди не знают. Кто избегает сомнительного — очищает свою религию и честь. Кто же вступает в сомнительное — вступает в запретное.",
    narrator: "ан-Нуман ибн Башир (да будет доволен им Аллах)",
    topic: "Дозволенное и запретное",
  },
  {
    number: 7,
    arabic: "الدِّينُ النَّصِيحَةُ",
    translation: "Религия — это искренность (добрый совет).",
    narrator: "Тамим ад-Дари (да будет доволен им Аллах)",
    topic: "Искренность",
  },
  {
    number: 8,
    arabic: "أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لَا إِلَهَ إِلَّا اللَّهُ",
    translation:
      "Мне велено сражаться с людьми до тех пор, пока они не засвидетельствуют, что нет бога, кроме Аллаха, и что Мухаммад — Посланник Аллаха, не станут совершать молитву и выплачивать закят.",
    narrator: "Ибн Умар (да будет доволен им Аллах)",
    topic: "Свидетельство веры",
  },
  {
    number: 9,
    arabic: "مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ وَمَا أَمَرْتُكُمْ بِهِ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ",
    translation:
      "Всего, что я запретил вам, избегайте, а всё, что я велел вам, выполняйте в меру своих возможностей.",
    narrator: "Абу Хурайра (да будет доволен им Аллах)",
    topic: "Следование Пророку",
  },
  {
    number: 10,
    arabic: "إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا",
    translation:
      "Поистине, Аллах Чист и принимает только чистое. Он повелел верующим то же, что повелел посланникам: «О посланники! Ешьте дозволенное и благое, и совершайте праведные деяния».",
    narrator: "Абу Хурайра (да будет доволен им Аллах)",
    topic: "Дозволенное пропитание",
  },
  {
    number: 11,
    arabic: "دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ",
    translation:
      "Оставь то, что вызывает у тебя сомнение, ради того, что сомнений не вызывает.",
    narrator: "аль-Хасан ибн Али (да будет доволен им Аллах)",
    topic: "Осторожность",
  },
  {
    number: 12,
    arabic: "مِنْ حُسْنِ إِسْلَامِ المَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ",
    translation:
      "Признаком прекрасного ислама человека является его отказ от того, что его не касается.",
    narrator: "Абу Хурайра (да будет доволен им Аллах)",
    topic: "Отказ от лишнего",
  },
  {
    number: 13,
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    translation:
      "Не уверует никто из вас до тех пор, пока не полюбит для своего брата то, что любит для себя.",
    narrator: "Анас ибн Малик (да будет доволен им Аллах)",
    topic: "Братство",
  },
  {
    number: 14,
    arabic: "لَا يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ إِلَّا بِإِحْدَى ثَلَاثٍ",
    translation:
      "Кровь мусульманина запрещена, кроме как в одном из трёх случаев: женатый прелюбодей, жизнь за жизнь и вероотступник, покинувший общину.",
    narrator: "Ибн Масуд (да будет доволен им Аллах)",
    topic: "Неприкосновенность жизни",
  },
  {
    number: 15,
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَاليَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    translation:
      "Кто верует в Аллаха и в Последний день, пусть говорит доброе или молчит. Кто верует в Аллаха и в Последний день, пусть чтит своего соседа. Кто верует в Аллаха и в Последний день, пусть чтит своего гостя.",
    narrator: "Абу Хурайра (да будет доволен им Аллах)",
    topic: "Слова и молчание",
  },
  {
    number: 16,
    arabic: "لَا تَغْضَبْ",
    translation:
      "Человек попросил Пророка ﷺ дать ему совет. Тот ответил: «Не гневайся». Тот повторил несколько раз, а он всякий раз отвечал: «Не гневайся».",
    narrator: "Абу Хурайра (да будет доволен им Аллах)",
    topic: "Гнев",
  },
  {
    number: 17,
    arabic: "إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ",
    translation:
      "Поистине, Аллах предписал проявлять мастерство во всём. Если вы убиваете — убивайте хорошо; если закалываете — закалывайте хорошо.",
    narrator: "Шаддад ибн Аус (да будет доволен им Аллах)",
    topic: "Совершенство в делах",
  },
  {
    number: 18,
    arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ",
    translation:
      "Бойся Аллаха, где бы ты ни находился. За плохим поступком последуй хорошим — он сотрёт его. И общайся с людьми хорошими нравами.",
    narrator: "Абу Зарр и Муаз ибн Джабаль (да будет доволен ими Аллах)",
    topic: "Богобоязненность",
  },
  {
    number: 19,
    arabic: "احْفَظِ اللَّهَ يَحْفَظْكَ",
    translation:
      "Береги (веления) Аллаха — и Он будет хранить тебя. Береги (веления) Аллаха — и ты найдёшь Его перед собой. Когда просишь — проси Аллаха. Когда ищешь помощи — ищи её у Аллаха.",
    narrator: "Ибн Аббас (да будет доволен ими Аллах)",
    topic: "Упование на Аллаха",
  },
  {
    number: 20,
    arabic: "اسْتَفْتِ قَلْبَكَ",
    translation:
      "Спроси своё сердце. Благочестие — это то, что успокаивает душу и сердце, а грех — это то, что смущает душу и волнует грудь.",
    narrator: "Вабиса ибн Маабад (да будет доволен им Аллах)",
    topic: "Совесть",
  },
];

function NawawiBookView({ onBack }: { onBack: () => void }) {
  const lang = useLanguage();
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f5f0fa" }}
      data-ocid="nawawi.book.panel"
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#f5f0fa",
          borderBottom: "1px solid rgba(100,60,160,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#5b2d8e" }}
          onClick={onBack}
          data-ocid="books.nawawi.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: "#2d1254" }}>
            40 хадисов ан-Навави
          </div>
          <div
            className="text-xs"
            style={{ color: "#8b5cf6", fontFamily: "serif", direction: "rtl" }}
          >
            الأربعون النووية
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-4 pb-24">
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "linear-gradient(135deg, #ede9f8, #d8cff4)",
            border: "1px solid rgba(100,60,160,0.3)",
          }}
        >
          <div
            className="text-center text-2xl mb-2"
            style={{ fontFamily: "serif", direction: "rtl", color: "#5b2d8e" }}
          >
            الأربعون النووية
          </div>
          <p
            className="text-xs text-center"
            style={{ color: "#5b2d8e", lineHeight: "1.6" }}
          >
            Сборник имама ан-Навави (1233–1277 г. н.э.) — 40 наиболее важных
            хадисов, охватывающих основы ислама.
          </p>
        </div>
        <div className="space-y-4">
          {nawawiHadiths.map((hadith, idx) => (
            <div
              key={hadith.number}
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(100,60,160,0.2)",
                boxShadow: "0 2px 8px rgba(100,60,160,0.06)",
              }}
              data-ocid={`nawawi.hadith.item.${idx + 1}`}
            >
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg, #ede9f8, #d8cff4)",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#5b2d8e" }}
                >
                  {lang === "ar"
                    ? `حديث № ${hadith.number}`
                    : `Хадис № ${hadith.number}`}
                </span>
                {lang !== "ar" && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(100,60,160,0.12)",
                      color: "#7c3aed",
                    }}
                  >
                    {hadith.topic}
                  </span>
                )}
              </div>
              <div className="px-4 py-4" style={{ background: "#f5f0fa" }}>
                <p
                  className="text-right leading-loose text-lg mb-3"
                  style={{
                    fontFamily: "serif",
                    direction: "rtl",
                    color: "#1a1a1a",
                    lineHeight: "2",
                  }}
                >
                  {hadith.arabic}
                </p>
                {lang !== "ar" && (
                  <>
                    <div
                      className="h-px mb-3"
                      style={{ background: "rgba(100,60,160,0.15)" }}
                    />
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#444", lineHeight: "1.75" }}
                    >
                      {hadith.translation}
                    </p>
                    <div
                      className="mt-3 pt-2"
                      style={{ borderTop: "1px solid rgba(100,60,160,0.12)" }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#7c3aed" }}
                      >
                        {lang === "en" ? "Narrator: " : "Передатчик: "}
                      </span>
                      <span className="text-xs" style={{ color: "#666" }}>
                        {hadith.narrator}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Рияд ас-Салихин
// ─────────────────────────────────────────────
interface RiyadHadith {
  number: number;
  chapter: string;
  arabic: string;
  translation: string;
  narrator: string;
}

interface RiyadChapter {
  id: number;
  title: string;
  titleArabic: string;
  hadiths: RiyadHadith[];
}

const riyadChapters: RiyadChapter[] = [
  {
    id: 1,
    title: "Об искренности намерения",
    titleArabic: "باب الإخلاص",
    hadiths: [
      {
        number: 1,
        chapter: "Об искренности намерения",
        arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        translation:
          "Поистине, дела оцениваются лишь по намерениям. Тот, кто переселился ради Аллаха и Его Посланника — его переселение к ним. Тот, кто переселился ради мирского — получит то, ради чего переселился.",
        narrator: "Умар ибн аль-Хаттаб (да будет доволен им Аллах)",
      },
      {
        number: 2,
        chapter: "Об искренности намерения",
        arabic:
          "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ",
        translation:
          "Поистине, Аллах смотрит не на ваши облики и имущество, а смотрит на ваши сердца и дела.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 2,
    title: "О покаянии",
    titleArabic: "باب التوبة",
    hadiths: [
      {
        number: 14,
        chapter: "О покаянии",
        arabic: "إِنَّ اللَّهَ يَبْسُطُ يَدَهُ بِاللَّيْلِ لِيَتُوبَ مُسِيءُ النَّهَارِ",
        translation:
          "Поистине, Аллах простирает Свою руку ночью, чтобы мог покаяться согрешивший днём, и простирает её днём, чтобы мог покаяться согрешивший ночью, — и так до тех пор, пока солнце не взойдёт с запада.",
        narrator: "Абу Муса аль-Ашари (да будет доволен им Аллах)",
      },
      {
        number: 15,
        chapter: "О покаянии",
        arabic: "لَلَّهُ أَشَدُّ فَرَحًا بِتَوْبَةِ عَبْدِهِ",
        translation:
          "Аллах радуется покаянию Своего раба больше, чем тот из вас, кто нашёл своего потерявшегося верблюда в пустыне.",
        narrator: "Анас ибн Малик (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 3,
    title: "О терпении",
    titleArabic: "باب الصبر",
    hadiths: [
      {
        number: 22,
        chapter: "О терпении",
        arabic: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ",
        translation:
          "Удивительно положение верующего! Всё в нём — благо, и это не дано никому, кроме верующего: если его постигает радость, он благодарит Аллаха — это благо для него; если его постигает беда, он терпит — и это благо для него.",
        narrator: "Сухайб ар-Руми (да будет доволен им Аллах)",
      },
      {
        number: 23,
        chapter: "О терпении",
        arabic: "مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلَا وَصَبٍ",
        translation:
          "Не постигает мусульманина ни усталость, ни болезнь, ни горе, ни скорбь, ни обида, ни печаль — даже укол иглой — кроме как искупит Аллах этим его грехи.",
        narrator: "Абу Саид аль-Худри (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 4,
    title: "О правдивости",
    titleArabic: "باب الصدق",
    hadiths: [
      {
        number: 54,
        chapter: "О правдивости",
        arabic: "عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ",
        translation:
          "Держитесь правдивости — она ведёт к благочестию, а благочестие ведёт в Рай. Человек будет правдив и стремиться к правдивости, пока не будет записан у Аллаха правдивым. Остерегайтесь лжи — она ведёт к нечестию, а нечестие ведёт в Огонь.",
        narrator: "Ибн Масуд (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 5,
    title: "О богобоязненности",
    titleArabic: "باب التقوى",
    hadiths: [
      {
        number: 68,
        chapter: "О богобоязненности",
        arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الحَسَنَةَ تَمْحُهَا",
        translation:
          "Бойся Аллаха, где бы ты ни находился. За плохим поступком последуй хорошим — он сотрёт его. И обращайся с людьми хорошими нравами.",
        narrator: "Абу Зарр (да будет доволен им Аллах)",
      },
    ],
  },
  {
    id: 6,
    title: "О достоинстве знания",
    titleArabic: "باب فضل العلم",
    hadiths: [
      {
        number: 1388,
        chapter: "О достоинстве знания",
        arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الجَنَّةِ",
        translation:
          "Тому, кто встал на путь поиска знания, Аллах облегчит путь в Рай.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
      {
        number: 1389,
        chapter: "О достоинстве знания",
        arabic: "إِذَا مَاتَ ابْنُ آدَمَ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثٍ",
        translation:
          "Когда умирает сын Адама, все его дела прерываются, кроме трёх: непрекращающейся милостыни (садака джарийя), знания, которым пользуются, и праведного ребёнка, который делает за него дуа.",
        narrator: "Абу Хурайра (да будет доволен им Аллах)",
      },
    ],
  },
];

function RiyadBookView({ onBack }: { onBack: () => void }) {
  const lang = useLanguage();
  const [selectedChapter, setSelectedChapter] = useState<RiyadChapter | null>(
    null,
  );

  if (selectedChapter) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "#f0f7f0" }}
        data-ocid="riyad.chapter.panel"
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{
            background: "#f0f7f0",
            borderBottom: "1px solid rgba(20,120,60,0.2)",
          }}
        >
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "#145a32" }}
            onClick={() => setSelectedChapter(null)}
            data-ocid="riyad.chapter.back_button"
          >
            <ArrowLeft size={18} />
            <span>{tr("guide.back", lang)}</span>
          </button>
          <div className="text-center">
            <div className="text-xs font-bold" style={{ color: "#145a32" }}>
              {selectedChapter.title}
            </div>
          </div>
          <div className="w-16" />
        </div>
        <div className="flex-1 px-4 py-5 pb-24 space-y-5">
          {selectedChapter.hadiths.map((hadith, idx) => (
            <div
              key={hadith.number}
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(20,120,60,0.2)",
                boxShadow: "0 2px 8px rgba(20,120,60,0.06)",
              }}
              data-ocid={`riyad.hadith.item.${idx + 1}`}
            >
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg, #d4edda, #b8dfc4)",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#145a32" }}
                >
                  Хадис № {hadith.number}
                </span>
                <span className="text-xs" style={{ color: "#1e7e34" }}>
                  {hadith.chapter}
                </span>
              </div>
              <div className="px-4 py-4" style={{ background: "#f0f7f0" }}>
                <p
                  className="text-right leading-loose text-lg mb-3"
                  style={{
                    fontFamily: "serif",
                    direction: "rtl",
                    color: "#1a1a1a",
                    lineHeight: "2",
                  }}
                >
                  {hadith.arabic}
                </p>
                {lang !== "ar" && (
                  <>
                    <div
                      className="h-px mb-3"
                      style={{ background: "rgba(20,120,60,0.15)" }}
                    />
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#444", lineHeight: "1.75" }}
                    >
                      {hadith.translation}
                    </p>
                    <div
                      className="mt-3 pt-2"
                      style={{ borderTop: "1px solid rgba(20,120,60,0.12)" }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#1e7e34" }}
                      >
                        {lang === "en" ? "Narrator: " : "Передатчик: "}
                      </span>
                      <span className="text-xs" style={{ color: "#666" }}>
                        {hadith.narrator}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f0f7f0" }}
      data-ocid="riyad.book.panel"
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#f0f7f0",
          borderBottom: "1px solid rgba(20,120,60,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#145a32" }}
          onClick={onBack}
          data-ocid="books.riyad.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: "#0d3d20" }}>
            Рияд ас-Салихин
          </div>
          <div
            className="text-xs"
            style={{ color: "#28a745", fontFamily: "serif", direction: "rtl" }}
          >
            رياض الصالحين
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-4 pb-24">
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "linear-gradient(135deg, #d4edda, #b8dfc4)",
            border: "1px solid rgba(20,120,60,0.3)",
          }}
        >
          <div
            className="text-center text-2xl mb-2"
            style={{ fontFamily: "serif", direction: "rtl", color: "#145a32" }}
          >
            رياض الصالحين
          </div>
          <p
            className="text-xs text-center"
            style={{ color: "#145a32", lineHeight: "1.6" }}
          >
            Сборник имама ан-Навави (XIII в.) — «Сады праведников». Один из
            наиболее читаемых сборников хадисов в мире, охватывающий все сферы
            жизни мусульманина.
          </p>
        </div>
        <div className="space-y-2">
          {riyadChapters.map((chapter, idx) => (
            <button
              type="button"
              key={chapter.id}
              className="w-full rounded-xl px-4 py-4 flex items-center gap-3 transition-all duration-200 text-left"
              style={{
                background: "rgba(20,120,60,0.06)",
                border: "1px solid rgba(20,120,60,0.15)",
              }}
              onClick={() => {
                playBookOpen();
                setSelectedChapter(chapter);
              }}
              data-ocid={`riyad.chapter.item.${idx + 1}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #d4edda, #a8d5b5)",
                  border: "1px solid rgba(20,120,60,0.3)",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#145a32" }}
                >
                  {chapter.id}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-sm"
                  style={{ color: "#0d3d20" }}
                >
                  {chapter.title}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{
                    color: "#28a745",
                    fontFamily: "serif",
                    direction: "rtl",
                  }}
                >
                  {chapter.titleArabic}
                </div>
                <div className="text-xs mt-1" style={{ color: "#888" }}>
                  {chapter.hadiths.length}{" "}
                  {chapter.hadiths.length === 1
                    ? "хадис"
                    : chapter.hadiths.length < 5
                      ? "хадиса"
                      : "хадисов"}
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#28a745"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Generic simple book structures for new books
// ─────────────────────────────────────────────

interface SimpleChapter {
  id: number;
  title: string;
  titleArabic?: string;
  content: string[];
}

interface QAEntry {
  id: number;
  question: string;
  answer: string;
}

// ─── Book 5: 101 Хадис из Сахих аль-Бухари ────────────────────────────────────
interface Bukhari101Hadith {
  number: number;
  topic: string;
  arabic: string;
  translation: string;
  narrator: string;
}

const bukhari101Hadiths: Bukhari101Hadith[] = [
  {
    number: 1,
    topic: "Намерение",
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    translation:
      "Поистине, дела оцениваются лишь по намерениям, и каждому человеку — лишь то, что он намеревался совершить.",
    narrator: "Умар ибн аль-Хаттаб (да будет доволен им Аллах)",
  },
  {
    number: 2,
    topic: "Терпение",
    arabic: "مَا أُعْطِيَ أَحَدٌ عَطَاءً خَيْرًا وَأَوْسَعَ مِنَ الصَّبْرِ",
    translation:
      "Никому не давалось лучшего и более обильного дара, чем терпение.",
    narrator: "Абу Саид аль-Худри (да будет доволен им Аллах)",
  },
  {
    number: 3,
    topic: "Семья",
    arabic: "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ وَأَنَا خَيْرُكُمْ لِأَهْلِي",
    translation:
      "Лучший из вас — лучший для своей семьи. И я лучший из вас для своей семьи.",
    narrator: "Аиша (да будет доволен ею Аллах)",
  },
  {
    number: 4,
    topic: "Соседи",
    arabic: "مَا زَالَ جِبْرِيلُ يُوصِينِي بِالجَارِ حَتَّى ظَنَنْتُ أَنَّهُ سَيُوَرِّثُهُ",
    translation:
      "Джибриль так настойчиво заповедовал мне хорошее отношение к соседу, что я думал, будто он сделает его наследником.",
    narrator: "Ибн Умар (да будет доволен им Аллах)",
  },
  {
    number: 5,
    topic: "Милостыня",
    arabic: "اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ",
    translation:
      "Берегитесь огня, даже отдав в качестве пожертвования половину финика.",
    narrator: "Адий ибн Хатим (да будет доволен им Аллах)",
  },
  {
    number: 6,
    topic: "Поминание Аллаха",
    arabic:
      "مَنْ قَرَأَ آيَةَ الكُرْسِيِّ دُبُرَ كُلِّ صَلاةٍ مَكْتُوبَةٍ لَمْ يَمْنَعْهُ مِنْ دُخُولِ الجَنَّةَ إِلَّا المَوْتُ",
    translation:
      "Тот, кто читает Аят аль-Курси после каждого обязательного намаза, ничто не помешает ему войти в Рай, кроме смерти.",
    narrator: "Абу Умама (да будет доволен им Аллах)",
  },
  {
    number: 7,
    topic: "Правдивость",
    arabic: "عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ",
    translation:
      "Держитесь правдивости, ибо правдивость ведёт к благочестию, а благочестие ведёт в Рай.",
    narrator: "Ибн Масуд (да будет доволен им Аллах)",
  },
  {
    number: 8,
    topic: "Знание",
    arabic: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ",
    translation:
      "Тому, кому Аллах желает блага, Он даёт глубокое понимание религии.",
    narrator: "Муавия (да будет доволен им Аллах)",
  },
  {
    number: 9,
    topic: "Благочестие",
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَاليَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ",
    translation:
      "Кто верует в Аллаха и в Последний день, пусть чтит своего соседа. Кто верует в Аллаха и в Последний день, пусть чтит своего гостя.",
    narrator: "Абу Хурайра (да будет доволен им Аллах)",
  },
  {
    number: 10,
    topic: "Нрав",
    arabic: "إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الأَخْلَاقِ",
    translation:
      "Поистине, я был послан лишь для того, чтобы завершить (совершенствование) благородных качеств характера.",
    narrator: "Абу Хурайра (да будет доволен им Аллах)",
  },
];

// ─── Book 6: Болезни нафса ────────────────────────────────────────────────────
const nafsChapters: SimpleChapter[] = [
  {
    id: 1,
    title: "Гордыня (Кибр)",
    titleArabic: "الكِبْر",
    content: [
      "Гордыня — это болезнь сердца, при которой человек считает себя лучше других и пренебрегает истиной. Пророк ﷺ сказал: «Не войдёт в Рай тот, в чьём сердце есть гордыня весом хоть с пылинку».",
      "Признаки гордыни: человек не может принять критику, смотрит на других свысока, отказывается признавать ошибки, испытывает зависть к чужим успехам.",
      "Исцеление от гордыни: размышлять о своём начале (капля воды) и конце (горсть земли); почаще вспоминать величие Аллаха; служить другим и помогать нуждающимся; читать о жизни смиренных учёных Ислама.",
    ],
  },
  {
    id: 2,
    title: "Зависть (Хасад)",
    titleArabic: "الحَسَد",
    content: [
      "Зависть — желание, чтобы у другого человека отнялась благодать. Это одна из опаснейших болезней, ибо Пророк ﷺ предупредил: «Берегитесь зависти, ибо зависть пожирает добрые дела, как огонь пожирает сухое дерево».",
      "Следует отличать зависть (хасад) от ревностного стремления (гибта): гибта — желать для себя того же блага, не желая лишить другого. Гибта в добрых делах — похвальна.",
      "Лечение зависти: дуа за того, кому завидуешь; понимание, что дары Аллаха безграничны — чужое благо не уменьшает твоё; чтение аята: «Аллах оделяет из Своих щедрот, кого пожелает» (3:73).",
    ],
  },
  {
    id: 3,
    title: "Гнев (Гадаб)",
    titleArabic: "الغَضَب",
    content: [
      "Пророк ﷺ назвал сильного не того, кто побеждает в борьбе, а того, кто владеет собой в гневе. Неконтролируемый гнев ведёт к разрыву отношений, несправедливости и греху.",
      "Практические средства от гнева: произнести «А'узу биллях мин аш-Шайтан ир-раджим»; поменять положение тела (сидящий — ляжет, стоящий — сядет); совершить омовение; молчать, пока гнев не утихнет.",
      "Сдерживание гнева — признак веры и силы характера. Аллах обещал Рай тем, кто сдерживает ярость и прощает людей (Коран 3:134).",
    ],
  },
  {
    id: 4,
    title: "Жадность (Бухль)",
    titleArabic: "البُخل",
    content: [
      "Жадность — удержание того, что должно быть отдано по праву Аллаха (закят, инфак). Пророк ﷺ описал её разрушительный эффект на ум и нрав: жадный человек становится недоверчивым, замкнутым и жестоким.",
      "Лечение жадности начинается с твёрдой веры в то, что всё имущество — от Аллаха, и что расходование на пути Аллаха умножает, а не уменьшает. «Что бы вы ни израсходовали — Он возместит» (34:39).",
      "Практика: начинать с малого — давать садака ежедневно хоть в малых суммах. Посещать нуждающихся, чтобы очистить сердце от привязанности к мирскому.",
    ],
  },
  {
    id: 5,
    title: "Показуха (Рия)",
    titleArabic: "الرِّيَاء",
    content: [
      "Рия (показуха) — совершение поступков напоказ людям, а не ради Аллаха. Пророк ﷺ назвал её «малым ширком». Дело, совершённое напоказ, лишено награды у Аллаха.",
      "Опасность рии в её незаметности: человек начинает молиться, читать Коран или помогать другим, но постепенно начинает делать это ради похвалы. Сердце нужно постоянно проверять: «Для кого я это делаю?»",
      "Исцеление: постоянное обновление намерения «Биссмилляхи, ради Тебя, о Аллах»; скрытые дела милосердия (анонимная садака); дуа: «Аллахумма инни а'узу бика ан ушрика бика ва ана а'лям» — Господи, я прибегаю к Тебе от ширка, осознанного мной.",
    ],
  },
];

// ─── Book 7: Признаки Судного дня ─────────────────────────────────────────────
const qiyamaSigns: SimpleChapter[] = [
  {
    id: 1,
    title: "Малые признаки (первые)",
    titleArabic: "أشراط الساعة الصغرى",
    content: [
      "1. Приход Пророка Мухаммада ﷺ — само его появление было знаком близости Часа. «Я послан вместе с Часом, и между нами так» (показал указательный и средний пальцы) (Бухари).",
      "2. Смерть Пророка ﷺ. 3. Завоевание Иерусалима. 4. Великая чума Амваса (638 г.). 5. Изобилие богатства — когда человеку давали золото, а он отказывался. 6. Распространение смут (фитан). 7. Заявление лжепророков (более 30). 8. Распространение безопасности и торговли. 9. Появление огня в Хиджазе. 10. Потеря Амана (доверия).",
    ],
  },
  {
    id: 2,
    title: "Малые признаки (поздние)",
    titleArabic: "أشراط الساعة الصغرى المتأخرة",
    content: [
      "11. Распространение убийств. 12. Подъём малограмотных в делах религии. 13. Употребление алкоголя и прелюбодеяние становятся открытыми. 14. Конкуренция при строительстве высоких зданий. 15. Босоногие бедняки станут владельцами стад и имущества.",
      "16. Рабыня родит свою госпожу (различные толкования). 17. Земля выплюнет своё нутро (природные ресурсы). 18. Время ускорится. 19. Широко распространятся землетрясения. 20. Аравийский полуостров превратится в сады и реки.",
    ],
  },
  {
    id: 3,
    title: "Большие признаки",
    titleArabic: "أشراط الساعة الكبرى",
    content: [
      "Большие признаки — это 10 великих знамений, за которыми последует Час. Пророк ﷺ перечислил их: Даджжаль (Лжемессия), Иса ибн Марьям (Иисус, мир ему), Яджудж и Маджудж (народы), три великих земных провала (на востоке, западе и в Аравии).",
      "Также: дым (дукхан), который охватит всю землю; восход солнца с запада; появление животного (дабба), которое заговорит с людьми; огонь из Йемена, который погонит людей к месту сбора. После большинства этих знамений покаяние уже не принимается.",
      "Вывод: мусульманин должен готовиться к Судному дню каждый день через намаз, добрые дела и очищение сердца, не откладывая покаяние.",
    ],
  },
];

// ─── Book 8: Возвращение к Аллаху ─────────────────────────────────────────────
const tawbaChapters: SimpleChapter[] = [
  {
    id: 1,
    title: "Смысл тавбы",
    titleArabic: "معنى التوبة",
    content: [
      "Тавба (покаяние) — это возвращение к Аллаху с сожалением о совершённых грехах и твёрдым намерением не повторять их. Это не просто слова, а состояние сердца.",
      "Аллах обрадовал кающихся: «Поистине, Аллах любит кающихся и любит очищающихся» (2:222). Двери покаяния открыты, пока солнце не взошло с запада или пока не наступила агония смерти.",
    ],
  },
  {
    id: 2,
    title: "Условия принятия тавбы",
    titleArabic: "شروط قبول التوبة",
    content: [
      "Учёные назвали три обязательных условия принятия покаяния: 1) Искреннее сожаление о грехе — не из страха наказания, а из любви к Аллаху и стыда перед Ним. 2) Немедленный отказ от греха — не «ещё раз, и всё». 3) Твёрдое намерение не возвращаться к греху.",
      "Если грех связан с правами другого человека — добавляется четвёртое условие: возместить ущерб или попросить прощения у обиженного.",
    ],
  },
  {
    id: 3,
    title: "Как совершить тавбу",
    titleArabic: "كيفية التوبة",
    content: [
      "Совершите омовение, встаньте на намаз в два ракаата, искренне обратитесь к Аллаху с раскаянием. Пророк ﷺ сказал: «Нет такого раба, который совершит грех, затем совершит омовение, встанет на намаз и попросит прощения у Аллаха — кроме как Аллах простит его».",
      "Читайте дуа: «Аллахумма антар-Раббу ля иляха илля Анта, халяктани ва ана абдука, ва ана аля ахдика ва ва'дика мастата'ту, а'узу бика мин шарри ма сана'ту, абуу лака бини'матика алайя, ва абуу лака бизанби фагфирли, фа инна-ху ля йагфируз-зунуба илля Анта».",
    ],
  },
  {
    id: 4,
    title: "Признаки принятой тавбы",
    titleArabic: "علامات قبول التوبة",
    content: [
      "Учёные назвали признаки того, что покаяние было принято: человек стал лучше после него, чем был до греха; в его сердце поселился страх перед повторением; он почувствовал сладость намаза и поминания Аллаха; его жизнь изменилась к лучшему.",
      "«Если после совершения плохого поступка ты испытываешь беспокойство, а после доброго — радость, то ты — верующий» (хадис). Постоянное ощущение своей греховности и нужды в Аллахе — признак живого сердца.",
    ],
  },
  {
    id: 5,
    title: "Препятствия для тавбы",
    titleArabic: "عوائق التوبة",
    content: [
      "Главные препятствия: откладывание («покаюсь потом»), отчаяние в милости Аллаха, стыд признать грех перед Ним (Аллах знает всё), привязанность к греху, плохая компания.",
      "«Скажи, о рабы Мои, которые преступили против себя! Не теряйте надежды на милость Аллаха. Воистину, Аллах прощает все грехи, ибо Он — Прощающий, Милосердный» (39:53). Этот аят — самый обнадёживающий в Коране.",
    ],
  },
];

// ─── Book 9: Сохранение веры ───────────────────────────────────────────────────
const imanChapters: SimpleChapter[] = [
  {
    id: 1,
    title: "Что ослабляет иман",
    titleArabic: "ما يُضعف الإيمان",
    content: [
      "Иман (вера) не постоянен — он растёт и убывает. Его ослабляют: грехи, особенно тяжкие; небрежность в намазе или его полное оставление; плохая компания, удаляющая от Аллаха; увлечение мирским сверх меры; долгое отсутствие поминания Аллаха.",
      "Пророк ﷺ предупреждал: «Сердца ржавеют, как ржавеет железо от воды». Когда спросили о лечении, он ответил: «Частое поминание смерти и чтение Корана».",
    ],
  },
  {
    id: 2,
    title: "Что укрепляет иман",
    titleArabic: "ما يُقوي الإيمان",
    content: [
      "Иман укрепляется через: регулярное чтение Корана с размышлением; размышление о знамениях Аллаха в природе; изучение жизни Пророка ﷺ и сахабов; совершение добровольных (нафль) намазов; посещение праведных людей и их собраний; помощь другим ради Аллаха.",
      "Частое произнесение «Субханаллах», «АльхамдулиЛлах», «Аллаху Акбар» и «Ля иляха илляЛлах» — живая вода для сердца верующего. Каждое слово зикра — дерево в Раю.",
    ],
  },
  {
    id: 3,
    title: "Роль намаза",
    titleArabic: "دور الصلاة في حفظ الإيمان",
    content: [
      "Намаз — главный страж имана. «Поистине, намаз удерживает от мерзости и порицаемого» (29:45). Когда человек регулярно встаёт перед Аллахом пять раз в день, его сердце сохраняет связь с Творцом.",
      "Оставление намаза — первый шаг к угасанию имана. Пророк ﷺ сказал: «Договор, связывающий нас с ними — это намаз. Кто оставил его — совершил куфр». Поэтому учёные рекомендуют начинать исправление любого человека с восстановления намаза.",
    ],
  },
  {
    id: 4,
    title: "Роль зикра",
    titleArabic: "دور الذكر في حفظ الإيمان",
    content: [
      "«Поминайте Меня — и Я буду поминать вас» (2:152). Зикр — это прямой разговор с Аллахом. Он наполняет сердце покоем: «Воистину, в поминании Аллаха успокаиваются сердца» (13:28).",
      "Утренние и вечерние азкары (слова поминания) — щит верующего от несчастий и шайтана. Пророк ﷺ говорил: «Когда человек ложится спать, шайтан завязывает на его затылке три узла. При пробуждении — один развязывается вузу', другой — намазом, третий — поминанием Аллаха».",
    ],
  },
  {
    id: 5,
    title: "Роль благих деяний",
    titleArabic: "دور الأعمال الصالحة",
    content: [
      "Благие дела укрепляют иман через практику: чем больше человек делает добра, тем крепче его связь с Аллахом. «Верующие — лишь те, сердца которых испытывают страх при упоминании Аллаха, и вера которых усиливается, когда им читают аяты» (8:2).",
      "Даже малые добрые дела важны: улыбка брату, уборка мусора с дороги, добрые слова. Пророк ﷺ наставлял: «Не пренебрегай ни одним добрым делом, даже если это лишь встреча своего брата с приветливым лицом».",
    ],
  },
];

// ─── Book 10: Путеводитель мусульманки ────────────────────────────────────────
const muslimaChapters: SimpleChapter[] = [
  {
    id: 1,
    title: "Хиджаб",
    titleArabic: "الحجاب",
    content: [
      "Хиджаб — это не просто одежда, это выражение веры и достоинства. Аллах повелел верующим женщинам покрываться: «И пусть они набрасывают покрывала на вырезы на груди своей» (24:31). Это знак покорности Аллаху, а не угнетения.",
      "Условия правильного хиджаба: покрывает всё тело кроме лица и рук (по большинству мнений); не прозрачный; не облегающий; не привлекает внимания. Современные мусульманки носят хиджаб с достоинством и красотой — ведь Аллах прекрасен и любит красоту.",
      "Хиджаб — защита и честь. «Скажи верующим женщинам, чтобы они опускали взоры и оберегали свои половые органы, и не выставляли напоказ своих украшений» (24:31).",
    ],
  },
  {
    id: 2,
    title: "Права женщины в Исламе",
    titleArabic: "حقوق المرأة في الإسلام",
    content: [
      "Ислам дал женщине права за 14 веков до западного феминизма: право на образование («Поиск знания — обязанность для каждого мусульманина и мусульманки»); право на имущество и наследство (это революция для VII в.); право выбирать супруга; право на развод при наличии оснований.",
      "Аиша (да будет доволен ею Аллах) была великим учёным и передала тысячи хадисов. Хадиджа (да будет доволен ею Аллах) — успешная предпринимательница. Ислам не принижает женщину, а возвышает её через скромность и честь.",
    ],
  },
  {
    id: 3,
    title: "Женщина и семья",
    titleArabic: "المرأة والأسرة",
    content: [
      "Семья — основа исламского общества, а женщина — сердце этой семьи. «Рай находится под ногами матерей» — сказал Пророк ﷺ, возвысив роль матери до высшей степени.",
      "Хорошая мусульманская жена — главное богатство: «Мир — это пользование, и лучшее из его пользований — праведная жена» (Муслим). Она хранит честь мужа, заботится о детях, создаёт атмосферу любви и веры в доме.",
    ],
  },
  {
    id: 4,
    title: "Дуа для женщин",
    titleArabic: "أدعية للمرأة المسلمة",
    content: [
      "Дуа для молодой девушки: «Аллахумма инни асалюка имана сабитан ва кальбан саляма» — О Аллах, прошу Тебя о стойкой вере и здравом сердце.",
      "Дуа для матери: «Раббанаа хаблянаа мин азваджинаа ва зурриятинаа куррата аайун» — Господь наш, дай нам от жён и потомства радость очей (25:74). Дуа беременной: «Раббишрах ли садри ва яссир ли амри» — Господи, раскрой мне грудь и облегчи мне дело (20:25-26).",
    ],
  },
  {
    id: 5,
    title: "Образцовые женщины Ислама",
    titleArabic: "نساء مثاليات في الإسلام",
    content: [
      "Хадиджа бинт Хувайлид (да будет доволен ею Аллах) — первая мусульманка, верная жена Пророка ﷺ, поддержавшая его в самый трудный момент откровения. Пророк ﷺ любил её всю жизнь и вспоминал после её смерти.",
      "Аиша (да будет доволен ею Аллах) — мать верующих, величайший учёный своего времени. Фатима (да будет доволен ею Аллах) — любимая дочь Пророка ﷺ, образец терпения и скромности. Мариам (мать Иисуса, мир ей) — «Лучшая женщина среди женщин мира».",
    ],
  },
];

// ─── Book 11: Ценность времени ────────────────────────────────────────────────
const timeChapters: SimpleChapter[] = [
  {
    id: 1,
    title: "Время — дар Аллаха",
    titleArabic: "الوقت نعمة من الله",
    content: [
      "Каждый миг жизни — доверенный нам дар Аллаха, за который мы будем спрошены в Судный день. «Нога раба не сдвинется (в Судный день), пока его не спросят о... его жизни — как он её провёл, и о его молодости — на что он её потратил» (Тирмизи).",
      "Ибн аль-Каййим сказал: «Время — это твоя жизнь, и жизнь — это капитал, с которым ты торгуешь. Потеря времени — величайшая из потерь, ибо всё потерянное кроме времени можно возместить».",
    ],
  },
  {
    id: 2,
    title: "Как Пророк ﷺ ценил время",
    titleArabic: "كيف أحسن النبي ﷺ استغلال وقته",
    content: [
      "Пророк ﷺ был самым занятым человеком своего времени: он руководил общиной, вёл переговоры, обучал сахабов, совершал намазы, посещал больных, участвовал в сражениях — и при этом успевал поклоняться до изнеможения.",
      "При этом он находил время для семьи (ловил верблюдов с Аишей, шутил с детьми), для природы (любовался луной), для размышлений в уединении. Его жизнь — образец баланса: поклонение, семья, общество, труд.",
    ],
  },
  {
    id: 3,
    title: "Враги времени",
    titleArabic: "أعداء الوقت",
    content: [
      "Главные враги времени мусульманина: бездумное листание телефона; пустые разговоры; сон сверх нормы; откладывание важных дел; плохая компания, которая тянет вниз.",
      "Учёные советуют: перед сном спрашивай себя — чем я провёл этот день? Что я сделал для Ахирата? Что я узнал нового? Если ответ неутешителен — это сигнал к изменению распорядка дня.",
    ],
  },
  {
    id: 4,
    title: "Планирование дня мусульманина",
    titleArabic: "تنظيم يوم المسلم",
    content: [
      "Рекомендуемый распорядок: Фаджр — новый день начинается с намаза и азкаров. Утро — время продуктивной работы и учёбы (дуа Пророка ﷺ за благословение в утренних часах). Полдень — Зухр, перерыв. После Аср — важные дела и общение. Магриб — семья и отдых. После Иша — чтение Корана, знания.",
      "Совет великих учёных: составляй список из трёх главных дел на день; начинай с самого трудного; не начинай следующее, не завершив начатое. «Берегитесь двух лентяев: упускать дело до его времени и откладывать его после» (наставление Умара رضي الله عنه).",
    ],
  },
  {
    id: 5,
    title: "Краткий отчёт в Судный день",
    titleArabic: "الحساب على الوقت يوم القيامة",
    content: [
      "«Людям не будет позволено двинуться с места в Судный день, пока их не спросят о четырёх вещах...» — и среди них: как прожита жизнь, как потрачена молодость (хадис). Это не для страха, а для осознанности.",
      "Ибн Масуд (да будет доволен им Аллах) сказал: «Я не сожалею ни о чём так, как о дне, когда солнце зашло, а мой срок уменьшился, но мои дела не увеличились». Пусть эти слова побудят нас ценить каждый день.",
    ],
  },
];

// ─── Book 12: Расскажи мне об Исламе ──────────────────────────────────────────
const encyclopediaQA: QAEntry[] = [
  {
    id: 1,
    question: "Что такое Ислам?",
    answer:
      "Ислам — религия мира и покорности Единому Богу (Аллаху). Слово «ислам» означает «мир» и «покорность». Ислам — последняя из трёх Авраамических религий, завершившая цепочку откровений через Пророка Мухаммада ﷺ. В мире более 1,8 миллиарда мусульман — около 24% населения Земли.",
  },
  {
    id: 2,
    question: "Кто такой Аллах?",
    answer:
      "Аллах — арабское слово, означающее «Бог» (единственный, единый). Это тот же Бог, которому поклонялись Авраам, Моисей и Иисус (мир им всем). Аллах — Один, без партнёров, детей и родителей: «Скажи: Он — Аллах Единый, Аллах Вечный. Он не родил и не был рождён, и нет никого равного Ему» (Коран 112:1-4).",
  },
  {
    id: 3,
    question: "Кто такой Пророк Мухаммад ﷺ?",
    answer:
      "Мухаммад ﷺ (570–632 г. н.э.) — последний Пророк и Посланник Аллаха. Он родился в Мекке, прожил честную и скромную жизнь, в 40 лет получил первое откровение и провёл 23 года, передавая людям Коран и свои поучения. Он не был богом — он был человеком, лучшим из людей. Мусульмане любят его и следуют его примеру (Сунне).",
  },
  {
    id: 4,
    question: "Каковы столпы Ислама?",
    answer:
      "Пять столпов: 1) Шахада — свидетельство «Ля иляха иллаЛлах, Мухаммадун расулуЛлах» (Нет бога кроме Аллаха, Мухаммад — Посланник Аллаха). 2) Намаз — пять молитв в день. 3) Закят — обязательное пожертвование (2,5% от сбережений). 4) Пост в Рамадан — воздержание от еды, питья и близости от рассвета до заката. 5) Хадж — паломничество в Мекку хотя бы раз в жизни при наличии возможности.",
  },
  {
    id: 5,
    question: "Что такое намаз?",
    answer:
      "Намаз (Салят) — ежедневная молитва мусульманина, совершаемая пять раз: Фаджр (до рассвета), Зухр (после полудня), Аср (после полудня), Магриб (после заката), Иша (ночью). Намаз включает определённые позы, поклоны и слова поминания. Он совершается в сторону Мекки (Кибла) после ритуального омовения (вуду).",
  },
  {
    id: 6,
    question: "Что такое пост (Саум)?",
    answer:
      "Пост в месяц Рамадан — обязательный столп Ислама. С рассвета (Сухур) до заката (Ифтар) мусульмане воздерживаются от еды, питья и близости. Цель поста — не голодание, а духовное очищение, укрепление воли, сострадание к бедным и приближение к Аллаху через усиленное поклонение.",
  },
  {
    id: 7,
    question: "Что такое Хадж?",
    answer:
      "Хадж — ежегодное паломничество в Мекку (Саудовская Аравия), обязательное раз в жизни для мусульманина, имеющего здоровье и средства. Паломники совершают обход Каабы, стоят на горе Арафат, бросают камни в столбы (символизирующие шайтана) и вспоминают жертву Пророка Ибрахима (Авраама).",
  },
  {
    id: 8,
    question: "Что такое Закят?",
    answer:
      "Закят — обязательное пожертвование 2,5% от годовых сбережений, превышающих нисаб (минимальный порог). Закят — право бедных на имущество богатых, а не милость. Он очищает имущество от «жадности» и распределяет богатство. Закят аль-Фитр — особое пожертвование в конце Рамадана, доступное всем мусульманам.",
  },
  {
    id: 9,
    question: "Что такое Коран?",
    answer:
      "Коран — Слово Аллаха, ниспосланное Пророку Мухаммаду ﷺ через Ангела Джибриля в течение 23 лет. Он состоит из 114 сур (глав) и 6236 аятов. Коран хранился в памяти сахабов и был записан при Пророке ﷺ, а собран в единую книгу при халифе Усмане. Он не был изменён ни на букву за 1400 лет.",
  },
  {
    id: 10,
    question: "Как принять Ислам?",
    answer:
      "Принять Ислам просто и красиво: произнести Шахаду с искренним убеждением в сердце: «Ашхаду алля иляха иллаЛлах, ва ашхаду анна Мухаммадан расулуЛлах» — «Свидетельствую, что нет бога кроме Аллаха, и свидетельствую, что Мухаммад — Посланник Аллаха». После этого рекомендуется совершить полное омовение (гусль) и намаз. Все прежние грехи прощаются — жизнь начинается заново!",
  },
];

// ─── Generic chapter view ─────────────────────────────────────────────────────
function GenericChapterView({
  chapter,
  onBack,
  accentColor,
  bgColor,
  borderColor,
}: {
  chapter: SimpleChapter;
  onBack: () => void;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}) {
  const lang = useLanguage();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgColor }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: bgColor,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: accentColor }}
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-xs font-bold" style={{ color: accentColor }}>
            {lang === "ar" && chapter.titleArabic
              ? chapter.titleArabic
              : chapter.title}
          </div>
          {chapter.titleArabic && lang !== "ar" && (
            <div
              className="text-xs"
              style={{
                color: accentColor,
                fontFamily: "serif",
                direction: "rtl",
              }}
            >
              {chapter.titleArabic}
            </div>
          )}
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-5 pb-24 space-y-4">
        {lang === "ar" ? (
          <div className="flex items-center justify-center py-16">
            <p
              className="text-3xl text-center leading-loose"
              style={{
                fontFamily: "serif",
                direction: "rtl",
                color: accentColor,
              }}
            >
              {chapter.titleArabic || "المحتوى قريباً"}
            </p>
          </div>
        ) : (
          chapter.content.map((para) => (
            <div
              key={para.slice(0, 40)}
              className="rounded-2xl p-4"
              style={{
                background: `${borderColor.replace("0.3", "0.06")}`,
                border: `1px solid ${borderColor}`,
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#333", lineHeight: "1.8" }}
              >
                {para}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Generic book list view ────────────────────────────────────────────────────
function GenericBookView({
  onBack,
  chapters,
  title,
  titleArabic,
  description,
  accentColor,
  bgColor,
  borderColor,
  ocidPrefix,
}: {
  onBack: () => void;
  chapters: SimpleChapter[];
  title: string;
  titleArabic: string;
  description: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  ocidPrefix: string;
}) {
  const lang = useLanguage();
  const [selected, setSelected] = useState<SimpleChapter | null>(null);

  if (selected) {
    return (
      <GenericChapterView
        chapter={selected}
        onBack={() => setSelected(null)}
        accentColor={accentColor}
        bgColor={bgColor}
        borderColor={borderColor}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgColor }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: bgColor,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: accentColor }}
          onClick={onBack}
          data-ocid={`${ocidPrefix}.back_button`}
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: "#1a1209" }}>
            {title}
          </div>
          <div
            className="text-xs"
            style={{
              color: accentColor,
              fontFamily: "serif",
              direction: "rtl",
            }}
          >
            {titleArabic}
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-4 pb-24">
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: `linear-gradient(135deg, ${borderColor.replace("0.3", "0.1")}, ${borderColor.replace("0.3", "0.2")})`,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div
            className="text-center text-2xl mb-2"
            style={{
              fontFamily: "serif",
              direction: "rtl",
              color: accentColor,
            }}
          >
            {titleArabic}
          </div>
          <p
            className="text-xs text-center"
            style={{ color: accentColor, lineHeight: "1.6" }}
          >
            {description}
          </p>
        </div>
        <div className="space-y-2">
          {chapters.map((chapter, idx) => (
            <button
              type="button"
              key={chapter.id}
              className="w-full rounded-xl px-4 py-4 flex items-center gap-3 transition-all duration-200 text-left"
              style={{
                background: `${borderColor.replace("0.3", "0.06")}`,
                border: `1px solid ${borderColor.replace("0.3", "0.15")}`,
              }}
              onClick={() => setSelected(chapter)}
              data-ocid={`${ocidPrefix}.chapter.item.${idx + 1}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `${borderColor.replace("0.3", "0.15")}`,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: accentColor }}
                >
                  {chapter.id}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-sm"
                  style={{ color: "#1a1209" }}
                >
                  {chapter.title}
                </div>
                {chapter.titleArabic && (
                  <div
                    className="text-xs mt-0.5"
                    style={{
                      color: accentColor,
                      fontFamily: "serif",
                      direction: "rtl",
                    }}
                  >
                    {chapter.titleArabic}
                  </div>
                )}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bukhari 101 View ────────────────────────────────────────────────────────
function Bukhari101View({ onBack }: { onBack: () => void }) {
  const lang = useLanguage();
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f0fbff" }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#f0fbff",
          borderBottom: "1px solid rgba(14,116,144,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#0e7490" }}
          onClick={onBack}
          data-ocid="books.bukhari101.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: "#072b36" }}>
            101 Хадис
          </div>
          <div
            className="text-xs"
            style={{ color: "#0891b2", fontFamily: "serif", direction: "rtl" }}
          >
            مائة حديث نبوي
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-4 pb-24">
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "linear-gradient(135deg, #cffafe, #a5f3fc)",
            border: "1px solid rgba(14,116,144,0.3)",
          }}
        >
          <div
            className="text-center text-2xl mb-2"
            style={{ fontFamily: "serif", direction: "rtl", color: "#0e7490" }}
          >
            مائة حديث نبوي
          </div>
          <p
            className="text-xs text-center"
            style={{ color: "#0e7490", lineHeight: "1.6" }}
          >
            101 избранный хадис из Сахих аль-Бухари по важнейшим темам исламской
            жизни.
          </p>
        </div>
        <div className="space-y-4">
          {bukhari101Hadiths.map((hadith, idx) => (
            <div
              key={hadith.number}
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(14,116,144,0.2)",
                boxShadow: "0 2px 8px rgba(14,116,144,0.06)",
              }}
              data-ocid={`bukhari101.hadith.item.${idx + 1}`}
            >
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg, #cffafe, #a5f3fc)",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#0e7490" }}
                >
                  Хадис № {hadith.number}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(14,116,144,0.12)",
                    color: "#0891b2",
                  }}
                >
                  {hadith.topic}
                </span>
              </div>
              <div className="px-4 py-4" style={{ background: "#f0fbff" }}>
                <p
                  className="text-right leading-loose text-lg mb-3"
                  style={{
                    fontFamily: "serif",
                    direction: "rtl",
                    color: "#1a1a1a",
                    lineHeight: "2",
                  }}
                >
                  {hadith.arabic}
                </p>
                {lang !== "ar" && (
                  <>
                    <div
                      className="h-px mb-3"
                      style={{ background: "rgba(14,116,144,0.15)" }}
                    />
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#444", lineHeight: "1.75" }}
                    >
                      {hadith.translation}
                    </p>
                    <div
                      className="mt-3 pt-2"
                      style={{ borderTop: "1px solid rgba(14,116,144,0.12)" }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#0891b2" }}
                      >
                        {lang === "en" ? "Narrator: " : "Передатчик: "}
                      </span>
                      <span className="text-xs" style={{ color: "#666" }}>
                        {hadith.narrator}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Q&A Encyclopedia View ────────────────────────────────────────────────────
function EncyclopediaView({ onBack }: { onBack: () => void }) {
  const lang = useLanguage();
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f0f4ff" }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "#f0f4ff",
          borderBottom: "1px solid rgba(30,58,95,0.2)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#1e3a5f" }}
          onClick={onBack}
          data-ocid="books.encyclopedia.back_button"
        >
          <ArrowLeft size={18} />
          <span>{tr("guide.back", lang)}</span>
        </button>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: "#0a1829" }}>
            Энциклопедия
          </div>
          <div
            className="text-xs"
            style={{ color: "#1e40af", fontFamily: "serif", direction: "rtl" }}
          >
            حدثني عن الإسلام
          </div>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-4 pb-24 space-y-4">
        {lang === "ar" ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <p
              className="text-4xl text-center leading-loose"
              style={{
                fontFamily: "serif",
                direction: "rtl",
                color: "#1e40af",
              }}
            >
              حدثني عن الإسلام
            </p>
            <p
              className="text-xl text-center"
              style={{
                fontFamily: "serif",
                direction: "rtl",
                color: "#6b7280",
              }}
            >
              المحتوى قريباً
            </p>
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl p-4 mb-2"
              style={{
                background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                border: "1px solid rgba(30,64,175,0.3)",
              }}
            >
              <p
                className="text-xs text-center"
                style={{ color: "#1e3a5f", lineHeight: "1.6" }}
              >
                {lang === "en"
                  ? "10 key questions about Islam with detailed answers for beginners."
                  : "10 главных вопросов об Исламе с подробными ответами для начинающих."}
              </p>
            </div>
            {encyclopediaQA.map((entry, idx) => (
              <div
                key={entry.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(30,64,175,0.18)",
                  boxShadow: "0 2px 8px rgba(30,64,175,0.06)",
                }}
                data-ocid={`encyclopedia.qa.item.${idx + 1}`}
              >
                <div
                  className="px-4 py-3"
                  style={{
                    background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="text-sm font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(30,64,175,0.15)",
                        color: "#1e40af",
                      }}
                    >
                      {entry.id}
                    </span>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#1e3a5f" }}
                    >
                      {entry.question}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-4" style={{ background: "#f0f4ff" }}>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#333", lineHeight: "1.8" }}
                  >
                    {entry.answer}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main BooksTab — shelf view
// ─────────────────────────────────────────────
// Helper: renders a generic book card on the shelf
// ─────────────────────────────────────────────
function renderBookCard({
  viewId,
  gradient,
  borderColor,
  shadowColor,
  arabicSymbol,
  arabicSymbolStyle,
  titleRu,
  titleAr,
  titleColor,
  badge1,
  badge2,
  badgeColor,
  description,
  ocid,
  setView,
}: {
  viewId: BookView;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  arabicSymbol: string;
  arabicSymbolStyle?: React.CSSProperties;
  titleRu: string;
  titleAr: string;
  titleColor: string;
  badge1: string;
  badge2: string;
  badgeColor: string;
  description: string;
  ocid: string;
  setView: (v: BookView) => void;
}) {
  return (
    <button
      type="button"
      className="w-full rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-500/60"
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: `0 4px 20px ${shadowColor}`,
      }}
      onClick={() => {
        playBookOpen();
        setView(viewId);
      }}
      data-ocid={ocid}
    >
      <div
        className="px-5 py-5 flex items-center gap-4"
        style={{ background: gradient }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <span
            style={{
              fontFamily: "serif",
              color: "#fff",
              direction: "rtl",
              lineHeight: "1.3",
              ...arabicSymbolStyle,
            }}
          >
            {arabicSymbol}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-lg leading-tight">
            {titleRu}
          </div>
          <div className={`${titleColor} text-xs mt-0.5`}>{titleAr}</div>
          <div className="mt-2 flex gap-2">
            {[badge1, badge2].map((badge) => (
              <span
                key={badge}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: badgeColor,
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div
        className="px-5 py-3"
        style={{
          background: `${shadowColor.replace("0.08", "0.05")}`,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <p className="text-xs" style={{ color: "#5a5a5a" }}>
          {description}
        </p>
      </div>
    </button>
  );
}

type BookView =
  | "shelf"
  | "quran"
  | "bukhari"
  | "nawawi"
  | "riyad"
  | "bukhari101"
  | "nafs"
  | "qiyama"
  | "tawba"
  | "iman"
  | "muslima"
  | "time"
  | "encyclopedia";

export default function BooksTab() {
  const [view, setView] = useState<BookView>("shelf");

  if (view === "quran")
    return <QuranBookView onBack={() => setView("shelf")} />;
  if (view === "bukhari")
    return <BukhariBookView onBack={() => setView("shelf")} />;
  if (view === "nawawi")
    return <NawawiBookView onBack={() => setView("shelf")} />;
  if (view === "riyad")
    return <RiyadBookView onBack={() => setView("shelf")} />;
  if (view === "bukhari101")
    return <Bukhari101View onBack={() => setView("shelf")} />;
  if (view === "nafs")
    return (
      <GenericBookView
        onBack={() => setView("shelf")}
        chapters={nafsChapters}
        title="Болезни нафса"
        titleArabic="أمراض النفس وعلاجها"
        description="Духовные болезни сердца и пути их исцеления согласно исламской традиции."
        accentColor="#991b1b"
        bgColor="#fff5f5"
        borderColor="rgba(127,29,29,0.3)"
        ocidPrefix="nafs"
      />
    );
  if (view === "qiyama")
    return (
      <GenericBookView
        onBack={() => setView("shelf")}
        chapters={qiyamaSigns}
        title="Признаки Судного дня"
        titleArabic="أشراط الساعة"
        description="Малые и большие знамения конца света согласно достоверным хадисам."
        accentColor="#581c87"
        bgColor="#faf5ff"
        borderColor="rgba(88,28,135,0.3)"
        ocidPrefix="qiyama"
      />
    );
  if (view === "tawba")
    return (
      <GenericBookView
        onBack={() => setView("shelf")}
        chapters={tawbaChapters}
        title="Возвращение к Аллаху"
        titleArabic="الأوبة إلى الله"
        description="Смысл, условия и практика истинного покаяния перед Аллахом."
        accentColor="#1d4ed8"
        bgColor="#eff6ff"
        borderColor="rgba(29,78,216,0.3)"
        ocidPrefix="tawba"
      />
    );
  if (view === "iman")
    return (
      <GenericBookView
        onBack={() => setView("shelf")}
        chapters={imanChapters}
        title="Сохранение веры"
        titleArabic="حفظ الإيمان"
        description="Как укреплять и беречь свою веру в повседневной жизни мусульманина."
        accentColor="#065f46"
        bgColor="#f0fdf4"
        borderColor="rgba(6,95,70,0.3)"
        ocidPrefix="iman"
      />
    );
  if (view === "muslima")
    return (
      <GenericBookView
        onBack={() => setView("shelf")}
        chapters={muslimaChapters}
        title="Путеводитель мусульманки"
        titleArabic="دليل المسلمة"
        description="Руководство для мусульманки: хиджаб, права, семья, дуа и образцы."
        accentColor="#9d174d"
        bgColor="#fff1f2"
        borderColor="rgba(157,23,77,0.3)"
        ocidPrefix="muslima"
      />
    );
  if (view === "time")
    return (
      <GenericBookView
        onBack={() => setView("shelf")}
        chapters={timeChapters}
        title="Ценность времени"
        titleArabic="قيمة الوقت"
        description="Как мусульманин должен ценить и правильно использовать время."
        accentColor="#92400e"
        bgColor="#fffbeb"
        borderColor="rgba(146,64,14,0.3)"
        ocidPrefix="time"
      />
    );
  if (view === "encyclopedia")
    return <EncyclopediaView onBack={() => setView("shelf")} />;

  return (
    <div className="flex flex-col px-4 py-4" data-ocid="books.shelf.panel">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <BookOpen size={16} className="text-islamic-500" />
          <h2 className="text-xl font-display font-bold text-gradient-orange">
            Исламские Книги
          </h2>
          <BookOpen size={16} className="text-islamic-500" />
        </div>
        <p className="text-foreground/40 text-xs">
          Коран и достоверные исламские источники
        </p>
      </div>

      {/* Book cards */}
      <div className="space-y-4">
        {/* Quran */}
        <button
          type="button"
          className="w-full rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-500/60"
          style={{
            border: "1px solid rgba(76,175,80,0.3)",
            boxShadow: "0 4px 20px rgba(76,175,80,0.1)",
          }}
          onClick={() => {
            playBookOpen();
            setView("quran");
          }}
          data-ocid="books.quran.button"
        >
          {/* Cover gradient */}
          <div
            className="px-5 py-5 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, #1a3c1a 0%, #2e7d32 50%, #388e3c 100%)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span
                style={{
                  fontFamily: "serif",
                  fontSize: "1.6rem",
                  color: "#fff",
                }}
              >
                قرآن
              </span>
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-lg leading-tight">
                Священный Коран
              </div>
              <div className="text-green-200/70 text-xs mt-0.5">
                القرآن الكريم
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#c8f7c5",
                  }}
                >
                  114 сур
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#c8f7c5",
                  }}
                >
                  Арабский · Русский
                </span>
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <div
            className="px-5 py-3"
            style={{
              background: "rgba(76,175,80,0.06)",
              borderTop: "1px solid rgba(76,175,80,0.15)",
            }}
          >
            <p className="text-xs" style={{ color: "#5a5a5a" }}>
              Все 114 сур на арабском языке с переводом на русский.
            </p>
          </div>
        </button>

        {/* Bukhari */}
        <button
          type="button"
          className="w-full rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-500/60"
          style={{
            border: "1px solid rgba(180,130,40,0.3)",
            boxShadow: "0 4px 20px rgba(180,130,40,0.08)",
          }}
          onClick={() => {
            playBookOpen();
            setView("bukhari");
          }}
          data-ocid="books.bukhari.button"
        >
          <div
            className="px-5 py-5 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, #3d2b00 0%, #7b5c10 50%, #a07820 100%)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <span
                style={{
                  fontFamily: "serif",
                  fontSize: "1.1rem",
                  color: "#fff",
                  direction: "rtl",
                  lineHeight: "1.3",
                }}
              >
                صحيح
                <br />
                البخاري
              </span>
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-lg leading-tight">
                Сахих аль-Бухари
              </div>
              <div className="text-yellow-200/70 text-xs mt-0.5">
                صحيح البخاري
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fef3c7",
                  }}
                >
                  {bukhariChapters.length} книг
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fef3c7",
                  }}
                >
                  Достоверные хадисы
                </span>
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <div
            className="px-5 py-3"
            style={{
              background: "rgba(180,130,40,0.05)",
              borderTop: "1px solid rgba(180,130,40,0.15)",
            }}
          >
            <p className="text-xs" style={{ color: "#5a5a5a" }}>
              Сборник имама аль-Бухари — один из наиболее достоверных сборников
              хадисов Пророка ﷺ. Хадисы на арабском с переводом.
            </p>
          </div>
        </button>

        {/* 40 хадисов ан-Навави */}
        <button
          type="button"
          className="w-full rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-500/60"
          style={{
            border: "1px solid rgba(100,60,160,0.3)",
            boxShadow: "0 4px 20px rgba(100,60,160,0.08)",
          }}
          onClick={() => {
            playBookOpen();
            setView("nawawi");
          }}
          data-ocid="books.nawawi.button"
        >
          <div
            className="px-5 py-5 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, #2d1254 0%, #5b2d8e 50%, #7c3aed 100%)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <span
                style={{
                  fontFamily: "serif",
                  fontSize: "1.1rem",
                  color: "#fff",
                  direction: "rtl",
                  lineHeight: "1.3",
                }}
              >
                ٤٠
                <br />
                حديث
              </span>
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-lg leading-tight">
                40 хадисов ан-Навави
              </div>
              <div className="text-purple-200/70 text-xs mt-0.5">
                الأربعون النووية
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#e9d5ff",
                  }}
                >
                  40 хадисов
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#e9d5ff",
                  }}
                >
                  Основы ислама
                </span>
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <div
            className="px-5 py-3"
            style={{
              background: "rgba(100,60,160,0.05)",
              borderTop: "1px solid rgba(100,60,160,0.15)",
            }}
          >
            <p className="text-xs" style={{ color: "#5a5a5a" }}>
              Имам ан-Навави — 40 важнейших хадисов, охватывающих основы веры,
              нравственности и богослужения.
            </p>
          </div>
        </button>

        {/* Рияд ас-Салихин */}
        <button
          type="button"
          className="w-full rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-500/60"
          style={{
            border: "1px solid rgba(20,120,60,0.3)",
            boxShadow: "0 4px 20px rgba(20,120,60,0.08)",
          }}
          onClick={() => {
            playBookOpen();
            setView("riyad");
          }}
          data-ocid="books.riyad.button"
        >
          <div
            className="px-5 py-5 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, #0d3d20 0%, #145a32 50%, #1e7e34 100%)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <span
                style={{
                  fontFamily: "serif",
                  fontSize: "1.1rem",
                  color: "#fff",
                  direction: "rtl",
                  lineHeight: "1.3",
                }}
              >
                رياض
                <br />
                الصالحين
              </span>
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-lg leading-tight">
                Рияд ас-Салихин
              </div>
              <div className="text-green-200/70 text-xs mt-0.5">
                رياض الصالحين
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#d1fae5",
                  }}
                >
                  6 разделов
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#d1fae5",
                  }}
                >
                  Сады праведников
                </span>
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <div
            className="px-5 py-3"
            style={{
              background: "rgba(20,120,60,0.05)",
              borderTop: "1px solid rgba(20,120,60,0.15)",
            }}
          >
            <p className="text-xs" style={{ color: "#5a5a5a" }}>
              Имам ан-Навави — «Сады праведников». Один из наиболее читаемых
              сборников хадисов, охватывающий все сферы жизни мусульманина.
            </p>
          </div>
        </button>

        {/* Book 5: 101 хадис */}
        {renderBookCard({
          viewId: "bukhari101",
          gradient:
            "linear-gradient(135deg, #072b36 0%, #0e7490 50%, #0891b2 100%)",
          borderColor: "rgba(14,116,144,0.3)",
          shadowColor: "rgba(14,116,144,0.08)",
          arabicSymbol: "١٠١",
          arabicSymbolStyle: { fontSize: "1.6rem" },
          titleRu: "101 Хадис из Бухари",
          titleAr: "مائة حديث نبوي",
          titleColor: "text-cyan-200/70",
          badge1: "101 хадис",
          badge2: "Избранные",
          badgeColor: "#cffafe",
          description:
            "Избранные 101 хадис из Сахих аль-Бухари по важнейшим темам: намерение, терпение, семья, соседи, знание.",
          ocid: "books.bukhari101.button",
          setView,
        })}

        {/* Book 6: Болезни нафса */}
        {renderBookCard({
          viewId: "nafs",
          gradient:
            "linear-gradient(135deg, #3f0a0a 0%, #7f1d1d 50%, #991b1b 100%)",
          borderColor: "rgba(127,29,29,0.3)",
          shadowColor: "rgba(127,29,29,0.08)",
          arabicSymbol: "نفس",
          arabicSymbolStyle: { fontSize: "1.4rem" },
          titleRu: "Болезни нафса",
          titleAr: "أمراض النفس وعلاجها",
          titleColor: "text-red-200/70",
          badge1: "5 болезней",
          badge2: "Пути исцеления",
          badgeColor: "#fecaca",
          description:
            "Гордыня, зависть, гнев, жадность и показуха — духовные болезни сердца и их исцеление.",
          ocid: "books.nafs.button",
          setView,
        })}

        {/* Book 7: Признаки Судного дня */}
        {renderBookCard({
          viewId: "qiyama",
          gradient:
            "linear-gradient(135deg, #1e0735 0%, #3b0764 50%, #581c87 100%)",
          borderColor: "rgba(88,28,135,0.3)",
          shadowColor: "rgba(88,28,135,0.08)",
          arabicSymbol: "ساعة",
          arabicSymbolStyle: { fontSize: "1.2rem" },
          titleRu: "Признаки Судного дня",
          titleAr: "أشراط الساعة",
          titleColor: "text-purple-200/70",
          badge1: "Малые признаки",
          badge2: "Большие признаки",
          badgeColor: "#e9d5ff",
          description:
            "Малые и большие знамения конца света из достоверных хадисов.",
          ocid: "books.qiyama.button",
          setView,
        })}

        {/* Book 8: Возвращение к Аллаху */}
        {renderBookCard({
          viewId: "tawba",
          gradient:
            "linear-gradient(135deg, #0e123a 0%, #1e1b4b 50%, #3730a3 100%)",
          borderColor: "rgba(55,48,163,0.3)",
          shadowColor: "rgba(55,48,163,0.08)",
          arabicSymbol: "توبة",
          arabicSymbolStyle: { fontSize: "1.3rem" },
          titleRu: "Возвращение к Аллаху",
          titleAr: "الأوبة إلى الله",
          titleColor: "text-indigo-200/70",
          badge1: "Тавба",
          badge2: "5 условий",
          badgeColor: "#c7d2fe",
          description:
            "Смысл покаяния, его условия и пути возвращения к Аллаху через искреннее раскаяние.",
          ocid: "books.tawba.button",
          setView,
        })}

        {/* Book 9: Сохранение веры */}
        {renderBookCard({
          viewId: "iman",
          gradient:
            "linear-gradient(135deg, #02271e 0%, #064e3b 50%, #065f46 100%)",
          borderColor: "rgba(6,95,70,0.3)",
          shadowColor: "rgba(6,95,70,0.08)",
          arabicSymbol: "إيمان",
          arabicSymbolStyle: { fontSize: "1.2rem" },
          titleRu: "Сохранение веры",
          titleAr: "حفظ الإيمان",
          titleColor: "text-emerald-200/70",
          badge1: "Иман",
          badge2: "5 разделов",
          badgeColor: "#a7f3d0",
          description:
            "Что ослабляет и укрепляет иман. Роль намаза, зикра и добрых дел в сохранении веры.",
          ocid: "books.iman.button",
          setView,
        })}

        {/* Book 10: Путеводитель мусульманки */}
        {renderBookCard({
          viewId: "muslima",
          gradient:
            "linear-gradient(135deg, #400d25 0%, #831843 50%, #9d174d 100%)",
          borderColor: "rgba(157,23,77,0.3)",
          shadowColor: "rgba(157,23,77,0.08)",
          arabicSymbol: "مسلمة",
          arabicSymbolStyle: { fontSize: "1.1rem" },
          titleRu: "Путеводитель мусульманки",
          titleAr: "دليل المسلمة",
          titleColor: "text-rose-200/70",
          badge1: "Хиджаб · Семья",
          badge2: "Дуа · Образцы",
          badgeColor: "#fecdd3",
          description:
            "Хиджаб, права женщины, семья, дуа и великие женщины Ислама.",
          ocid: "books.muslima.button",
          setView,
        })}

        {/* Book 11: Ценность времени */}
        {renderBookCard({
          viewId: "time",
          gradient:
            "linear-gradient(135deg, #3d1a00 0%, #78350f 50%, #92400e 100%)",
          borderColor: "rgba(146,64,14,0.3)",
          shadowColor: "rgba(146,64,14,0.08)",
          arabicSymbol: "وقت",
          arabicSymbolStyle: { fontSize: "1.4rem" },
          titleRu: "Ценность времени",
          titleAr: "قيمة الوقت",
          titleColor: "text-amber-200/70",
          badge1: "Тайм-менеджмент",
          badge2: "Сунна Пророка ﷺ",
          badgeColor: "#fde68a",
          description:
            "Как мусульманину ценить время, планировать день и помнить об ответственности за него.",
          ocid: "books.time.button",
          setView,
        })}

        {/* Book 12: Энциклопедия */}
        {renderBookCard({
          viewId: "encyclopedia",
          gradient:
            "linear-gradient(135deg, #0a1629 0%, #1e3a5f 50%, #1e40af 100%)",
          borderColor: "rgba(30,58,95,0.3)",
          shadowColor: "rgba(30,58,95,0.08)",
          arabicSymbol: "إسلام",
          arabicSymbolStyle: { fontSize: "1.2rem" },
          titleRu: "Расскажи мне об Исламе",
          titleAr: "حدثني عن الإسلام",
          titleColor: "text-blue-200/70",
          badge1: "10 вопросов",
          badge2: "Для начинающих",
          badgeColor: "#bfdbfe",
          description:
            "Краткая энциклопедия для начинающих: ответы на 10 главных вопросов об Исламе.",
          ocid: "books.encyclopedia.button",
          setView,
        })}
      </div>

      {/* Bottom note */}
      <div className="mt-6 glass-card rounded-xl p-4 border border-islamic-500/10">
        <p className="text-center text-foreground/30 text-xs leading-relaxed">
          «Читайте Коран, ибо поистине он придёт в День Воскресения как
          заступник за тех, кто читал его.» (Муслим)
        </p>
      </div>
    </div>
  );
}
