import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BookOpen, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { type Surah, quranSurahs } from "../data/quranSurahs";

export default function QuranTab() {
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

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-1">
          <BookOpen size={16} className="text-orange-500" />
          <h2 className="text-xl font-display font-bold text-gradient-orange">
            Священный Коран
          </h2>
          <BookOpen size={16} className="text-orange-500" />
        </div>
        <p className="text-foreground/40 text-xs">
          114 сур — на арабском и по-русски
        </p>
        <div
          className="text-2xl mt-2 text-foreground/20"
          style={{ fontFamily: "serif", direction: "rtl" }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
        />
        <Input
          placeholder="Поиск суры по названию или номеру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-foreground/30 text-sm"
          data-ocid="quran.search_input"
        />
      </div>

      {/* Count */}
      <div className="text-xs text-foreground/30 mb-3 text-right">
        {filtered.length} из 114 сур
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 text-foreground/30"
          data-ocid="quran.empty_state"
        >
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">Ничего не найдено</p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((surah) => (
            <button
              type="button"
              key={surah.number}
              className="w-full glass-card rounded-xl px-4 py-3 flex items-center gap-3 hover:border-orange-500/30 transition-all duration-200 text-left group"
              onClick={() => setSelectedSurah(surah)}
              data-ocid={`quran.surah.item.${surah.number}`}
            >
              {/* Number badge */}
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-orange-400">
                  {surah.number}
                </span>
              </div>

              {/* Names */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-sm truncate">
                    {surah.nameRu}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 border-orange-500/20 text-orange-400/60 shrink-0"
                  >
                    {surah.place}
                  </Badge>
                </div>
                <div className="text-foreground/40 text-xs">
                  {surah.transliteration} · {surah.verses} аятов
                </div>
              </div>

              {/* Arabic name */}
              <div
                className="text-lg font-bold text-foreground/70 group-hover:text-orange-400 transition-colors shrink-0"
                style={{ fontFamily: "serif", direction: "rtl" }}
              >
                {surah.arabic}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Surah Detail Sheet */}
      <Sheet
        open={!!selectedSurah}
        onOpenChange={(open) => !open && setSelectedSurah(null)}
      >
        <SheetContent
          side="bottom"
          className="bg-card border-orange-500/20 rounded-t-2xl max-h-[85vh] overflow-y-auto"
          data-ocid="quran.surah.sheet"
        >
          {selectedSurah && (
            <>
              <SheetHeader className="pb-4 relative">
                <button
                  type="button"
                  className="absolute right-0 top-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                  onClick={() => setSelectedSurah(null)}
                  data-ocid="quran.surah.close_button"
                >
                  <X size={14} />
                </button>
                <SheetTitle className="text-foreground font-display text-left pr-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-400">
                        {selectedSurah.number}
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-bold text-foreground">
                        {selectedSurah.nameRu}
                      </div>
                      <div className="text-xs text-foreground/40 font-normal">
                        {selectedSurah.transliteration}
                      </div>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* Arabic name large */}
              <div className="text-center mb-5">
                <div
                  className="text-4xl font-bold text-gradient-orange leading-relaxed"
                  style={{ fontFamily: "serif", direction: "rtl" }}
                >
                  {selectedSurah.arabic}
                </div>
              </div>

              {/* Basmala */}
              {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
                <div
                  className="text-center text-lg text-foreground/60 mb-5 pb-4 border-b border-orange-500/10"
                  style={{ fontFamily: "serif", direction: "rtl" }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="glass-card rounded-xl p-3 text-center">
                  <div className="text-orange-400 text-lg font-bold">
                    {selectedSurah.number}
                  </div>
                  <div className="text-foreground/40 text-[10px] mt-0.5">
                    Номер суры
                  </div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <div className="text-orange-400 text-lg font-bold">
                    {selectedSurah.verses}
                  </div>
                  <div className="text-foreground/40 text-[10px] mt-0.5">
                    Аятов
                  </div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <div className="text-orange-400 text-sm font-bold">
                    {selectedSurah.place}
                  </div>
                  <div className="text-foreground/40 text-[10px] mt-0.5">
                    Место
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="glass-card rounded-xl p-4 mb-4">
                <div className="text-xs text-orange-400 uppercase tracking-widest mb-2 font-medium">
                  О суре
                </div>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {selectedSurah.descriptionRu}
                </p>
              </div>

              {/* Surah 1 full text */}
              {selectedSurah.number === 1 && (
                <div className="glass-card rounded-xl p-4 mb-4">
                  <div className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-medium">
                    Текст суры
                  </div>
                  <div
                    className="text-right text-foreground/90 leading-[2.2] text-lg"
                    style={{ fontFamily: "serif", direction: "rtl" }}
                  >
                    <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾</p>
                    <p>الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾</p>
                    <p>الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾</p>
                    <p>مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾</p>
                    <p>إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾</p>
                    <p>اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾</p>
                    <p>
                      صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-orange-500/10 space-y-2 text-foreground/60 text-sm">
                    <p>
                      <span className="text-orange-400/70">1.</span> Во имя
                      Аллаха, Милостивого, Милосердного!
                    </p>
                    <p>
                      <span className="text-orange-400/70">2.</span> Хвала
                      Аллаху, Господу миров,
                    </p>
                    <p>
                      <span className="text-orange-400/70">3.</span>{" "}
                      Милостивому, Милосердному,
                    </p>
                    <p>
                      <span className="text-orange-400/70">4.</span> Владыке Дня
                      воздаяния!
                    </p>
                    <p>
                      <span className="text-orange-400/70">5.</span> Тебе одному
                      мы поклоняемся и Тебя одного молим о помощи.
                    </p>
                    <p>
                      <span className="text-orange-400/70">6.</span> Веди нас
                      прямым путём,
                    </p>
                    <p>
                      <span className="text-orange-400/70">7.</span> путём тех,
                      кого Ты облагодетельствовал, не тех, на кого Ты
                      разгневался, и не заблудших.
                    </p>
                  </div>
                </div>
              )}

              {/* Short surahs full text */}
              {selectedSurah.number === 112 && (
                <div className="glass-card rounded-xl p-4 mb-4">
                  <div className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-medium">
                    Текст суры
                  </div>
                  <div
                    className="text-right text-foreground/90 leading-[2.2] text-lg"
                    style={{ fontFamily: "serif", direction: "rtl" }}
                  >
                    <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <p>قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾</p>
                    <p>اللَّهُ الصَّمَدُ ﴿٢﴾</p>
                    <p>لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾</p>
                    <p>وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-orange-500/10 space-y-2 text-foreground/60 text-sm">
                    <p>
                      <span className="text-orange-400/70">1.</span> Скажи: «Он
                      — Аллах Единый,
                    </p>
                    <p>
                      <span className="text-orange-400/70">2.</span> Аллах
                      Вечный.
                    </p>
                    <p>
                      <span className="text-orange-400/70">3.</span> Он не родил
                      и не был рождён,
                    </p>
                    <p>
                      <span className="text-orange-400/70">4.</span> и нет
                      никого равного Ему».
                    </p>
                  </div>
                </div>
              )}

              {selectedSurah.number === 113 && (
                <div className="glass-card rounded-xl p-4 mb-4">
                  <div className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-medium">
                    Текст суры
                  </div>
                  <div
                    className="text-right text-foreground/90 leading-[2.2] text-lg"
                    style={{ fontFamily: "serif", direction: "rtl" }}
                  >
                    <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <p>قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾</p>
                    <p>مِن شَرِّ مَا خَلَقَ ﴿٢﴾</p>
                    <p>وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾</p>
                    <p>وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾</p>
                    <p>وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-orange-500/10 space-y-2 text-foreground/60 text-sm">
                    <p>
                      <span className="text-orange-400/70">1.</span> Скажи:
                      «Прибегаю к защите Господа рассвета
                    </p>
                    <p>
                      <span className="text-orange-400/70">2.</span> от зла
                      того, что Он сотворил,
                    </p>
                    <p>
                      <span className="text-orange-400/70">3.</span> от зла
                      мрака, когда он наступает,
                    </p>
                    <p>
                      <span className="text-orange-400/70">4.</span> от зла
                      колдуний, дующих на узлы,
                    </p>
                    <p>
                      <span className="text-orange-400/70">5.</span> от зла
                      завистника, когда он завидует».
                    </p>
                  </div>
                </div>
              )}

              {selectedSurah.number === 114 && (
                <div className="glass-card rounded-xl p-4 mb-4">
                  <div className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-medium">
                    Текст суры
                  </div>
                  <div
                    className="text-right text-foreground/90 leading-[2.2] text-lg"
                    style={{ fontFamily: "serif", direction: "rtl" }}
                  >
                    <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <p>قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾</p>
                    <p>مَلِكِ النَّاسِ ﴿٢﴾</p>
                    <p>إِلَٰهِ النَّاسِ ﴿٣﴾</p>
                    <p>مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾</p>
                    <p>الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾</p>
                    <p>مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-orange-500/10 space-y-2 text-foreground/60 text-sm">
                    <p>
                      <span className="text-orange-400/70">1.</span> Скажи:
                      «Прибегаю к защите Господа людей,
                    </p>
                    <p>
                      <span className="text-orange-400/70">2.</span> Царя людей,
                    </p>
                    <p>
                      <span className="text-orange-400/70">3.</span> Бога людей,
                    </p>
                    <p>
                      <span className="text-orange-400/70">4.</span> от зла
                      искусителя исчезающего,
                    </p>
                    <p>
                      <span className="text-orange-400/70">5.</span> который
                      нашёптывает в груди людей,
                    </p>
                    <p>
                      <span className="text-orange-400/70">6.</span> будь то
                      джинны или люди».
                    </p>
                  </div>
                </div>
              )}

              {/* Hint for longer surahs */}
              {selectedSurah.number > 1 &&
                selectedSurah.number !== 112 &&
                selectedSurah.number !== 113 &&
                selectedSurah.number !== 114 && (
                  <div className="text-center text-foreground/20 text-xs pb-2">
                    Для чтения полного текста откройте Коран
                  </div>
                )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
