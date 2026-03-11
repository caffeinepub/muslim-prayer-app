import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SEED_BOOK_IDS, seedBooks } from "../data/seedBooks";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CustomHadith {
  id: string;
  number: number;
  arabic: string;
  translation: string;
  narrator?: string;
}

export interface CustomChapter {
  id: string;
  title: string;
  titleArabic?: string;
  hadiths: CustomHadith[];
}

export interface CustomAyah {
  id: string;
  number: number;
  arabic: string;
  translation: string;
}

export interface CustomBook {
  id: string;
  title: string;
  titleArabic?: string;
  description?: string;
  coverColor: string;
  type: "hadith" | "quran_surah" | "general" | "pdf";
  chapters?: CustomChapter[];
  ayahs?: CustomAyah[];
  pdfDataUrl?: string; // base64 data URL for PDF books
  published?: boolean; // if true, visible to all users; if false/undefined, visible only to admin
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = "custom_books_data";
const SEED_VERSION_KEY = "custom_books_seed_version";
const CURRENT_SEED_VERSION = "3"; // bumped to re-seed with full Quran & remove empty books

/** A book is considered empty if it has no chapters/ayahs and is not a PDF with content */
function isEmptyBook(b: CustomBook): boolean {
  if (b.type === "pdf") return !b.pdfDataUrl;
  const hasChapters = (b.chapters?.length ?? 0) > 0;
  const hasAyahs = (b.ayahs?.length ?? 0) > 0;
  return !hasChapters && !hasAyahs;
}

/**
 * Returns all books: seed books (pre-populated Islamic library) merged with
 * any custom books the admin has added. Seed books are initialised once per
 * seed-version and can then be freely edited/deleted by the admin.
 */
export function getCustomBooks(): CustomBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const seedVersion = localStorage.getItem(SEED_VERSION_KEY);

    // First-ever load or seed version changed → populate with seed books
    if (!raw || seedVersion !== CURRENT_SEED_VERSION) {
      const existing: CustomBook[] = raw
        ? (JSON.parse(raw) as CustomBook[])
        : [];
      // Keep custom (non-seed) non-empty books, replace seed books with latest seed
      const customOnly = existing.filter(
        (b) => !SEED_BOOK_IDS.includes(b.id) && !isEmptyBook(b),
      );
      const merged = [...seedBooks, ...customOnly];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
      return merged;
    }

    // Only filter out empty seed books — never remove admin-created books
    const all = JSON.parse(raw) as CustomBook[];
    return all.filter((b) => !SEED_BOOK_IDS.includes(b.id) || !isEmptyBook(b));
  } catch {
    return seedBooks;
  }
}

function saveCustomBooks(books: CustomBook[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
  // Notify other components (e.g. BooksTab) that custom books changed
  window.dispatchEvent(new Event("custom-books-updated"));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Animation variants ───────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ─── Color presets for book covers ───────────────────────────────────────────
const COVER_COLORS = [
  "#1a3c1a", // deep green
  "#3d2b00", // deep gold
  "#2d1254", // deep purple
  "#0a1629", // deep navy
  "#3f0a0a", // deep crimson
  "#0d3d20", // emerald
  "#1e0735", // indigo
  "#3d1a00", // amber
  "#400d25", // rose
  "#072b36", // teal
];

// ─── Access Guard ─────────────────────────────────────────────────────────────
function useIsAdmin(): boolean {
  return sessionStorage.getItem("author_session") === "1";
}

// ─── Confirmation hook (inline, no window.confirm) ───────────────────────────
function useConfirm() {
  const [pending, setPending] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const ask = useCallback((message: string, onConfirm: () => void) => {
    setPending({ message, onConfirm });
  }, []);

  const confirm = useCallback(() => {
    pending?.onConfirm();
    setPending(null);
  }, [pending]);

  const cancel = useCallback(() => setPending(null), []);

  return { pending, ask, confirm, cancel };
}

function ConfirmDialog({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: { message: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          data-ocid="admin.delete.dialog"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card rounded-2xl p-6 max-w-xs w-full space-y-4 border border-red-500/30"
          >
            <h3 className="font-bold text-foreground text-base">
              Подтверждение
            </h3>
            <p className="text-sm text-muted-foreground">{pending.message}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-foreground/20"
                onClick={onCancel}
                data-ocid="admin.delete.cancel_button"
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={onConfirm}
                data-ocid="admin.delete.confirm_button"
              >
                Удалить
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── HadithEditor: per-hadith inline form ────────────────────────────────────
function HadithForm({
  initial,
  onSave,
  onCancel,
  nextNumber,
}: {
  initial?: CustomHadith;
  onSave: (h: CustomHadith) => void;
  onCancel: () => void;
  nextNumber: number;
}) {
  const [arabic, setArabic] = useState(initial?.arabic ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");
  const [narrator, setNarrator] = useState(initial?.narrator ?? "");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!arabic.trim()) e.arabic = true;
    if (!translation.trim()) e.translation = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initial?.id ?? generateId(),
      number: initial?.number ?? nextNumber,
      arabic: arabic.trim(),
      translation: translation.trim(),
      narrator: narrator.trim() || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3 rounded-xl overflow-hidden"
      style={{ background: "oklch(0.15 0.025 45 / 0.5)", padding: "1rem" }}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold text-islamic-400">
          Арабский текст *
        </p>
        <Textarea
          value={arabic}
          onChange={(e) => setArabic(e.target.value)}
          placeholder="أَرَأَيْتَ..."
          className={`text-right bg-secondary/50 resize-none ${errors.arabic ? "border-red-500/70" : "border-islamic-500/20"}`}
          style={{ direction: "rtl", fontFamily: "serif" }}
          rows={3}
          data-ocid="admin.hadith.arabic.textarea"
        />
        {errors.arabic && (
          <p
            className="text-xs text-red-400"
            data-ocid="admin.hadith.arabic.error_state"
          >
            Обязательное поле
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-islamic-400">Перевод *</p>
        <Textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="Перевод хадиса..."
          className={`bg-secondary/50 resize-none ${errors.translation ? "border-red-500/70" : "border-islamic-500/20"}`}
          rows={3}
          data-ocid="admin.hadith.translation.textarea"
        />
        {errors.translation && (
          <p
            className="text-xs text-red-400"
            data-ocid="admin.hadith.translation.error_state"
          >
            Обязательное поле
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/60">
          Передатчик (необязательно)
        </p>
        <Input
          value={narrator}
          onChange={(e) => setNarrator(e.target.value)}
          placeholder="Абу Хурайра (да будет доволен им Аллах)"
          className="bg-secondary/50 border-islamic-500/20"
          data-ocid="admin.hadith.narrator.input"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-foreground/20"
          onClick={onCancel}
          data-ocid="admin.hadith.cancel_button"
        >
          Отмена
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-islamic-500 text-black hover:bg-islamic-400"
          onClick={handleSave}
          data-ocid="admin.hadith.save_button"
        >
          Сохранить
        </Button>
      </div>
    </motion.div>
  );
}

// ─── AyahForm ─────────────────────────────────────────────────────────────────
function AyahForm({
  initial,
  onSave,
  onCancel,
  nextNumber,
}: {
  initial?: CustomAyah;
  onSave: (a: CustomAyah) => void;
  onCancel: () => void;
  nextNumber: number;
}) {
  const [arabic, setArabic] = useState(initial?.arabic ?? "");
  const [translation, setTranslation] = useState(initial?.translation ?? "");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!arabic.trim()) e.arabic = true;
    if (!translation.trim()) e.translation = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initial?.id ?? generateId(),
      number: initial?.number ?? nextNumber,
      arabic: arabic.trim(),
      translation: translation.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3 rounded-xl overflow-hidden"
      style={{ background: "oklch(0.15 0.025 45 / 0.5)", padding: "1rem" }}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold text-islamic-400">
          Арабский текст аята *
        </p>
        <Textarea
          value={arabic}
          onChange={(e) => setArabic(e.target.value)}
          placeholder="بِسْمِ اللَّهِ..."
          className={`text-right bg-secondary/50 resize-none ${errors.arabic ? "border-red-500/70" : "border-islamic-500/20"}`}
          style={{ direction: "rtl", fontFamily: "serif" }}
          rows={3}
          data-ocid="admin.ayah.arabic.textarea"
        />
        {errors.arabic && (
          <p
            className="text-xs text-red-400"
            data-ocid="admin.ayah.arabic.error_state"
          >
            Обязательное поле
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-islamic-400">Перевод *</p>
        <Textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="Перевод аята..."
          className={`bg-secondary/50 resize-none ${errors.translation ? "border-red-500/70" : "border-islamic-500/20"}`}
          rows={3}
          data-ocid="admin.ayah.translation.textarea"
        />
        {errors.translation && (
          <p
            className="text-xs text-red-400"
            data-ocid="admin.ayah.translation.error_state"
          >
            Обязательное поле
          </p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-foreground/20"
          onClick={onCancel}
          data-ocid="admin.ayah.cancel_button"
        >
          Отмена
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-islamic-500 text-black hover:bg-islamic-400"
          onClick={handleSave}
          data-ocid="admin.ayah.save_button"
        >
          Сохранить
        </Button>
      </div>
    </motion.div>
  );
}

// ─── ChapterEditor ────────────────────────────────────────────────────────────
function ChapterEditor({
  chapter,
  bookType,
  onSave,
  onBack,
}: {
  chapter: CustomChapter;
  bookType: "hadith" | "general" | "quran_surah";
  onSave: (ch: CustomChapter) => void;
  onBack: () => void;
}) {
  const { pending, ask, confirm, cancel } = useConfirm();
  const [hadiths, setHadiths] = useState<CustomHadith[]>(chapter.hadiths ?? []);
  const [addingHadith, setAddingHadith] = useState(false);
  const [editingHadithId, setEditingHadithId] = useState<string | null>(null);
  const isDirty = useRef(false);

  const handleSaveHadith = (h: CustomHadith) => {
    setHadiths((prev) => {
      const idx = prev.findIndex((x) => x.id === h.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = h;
        return next;
      }
      return [...prev, h];
    });
    setAddingHadith(false);
    setEditingHadithId(null);
    isDirty.current = true;
  };

  const handleDeleteHadith = (id: string) => {
    ask("Удалить этот хадис?", () => {
      setHadiths((prev) => prev.filter((h) => h.id !== id));
      isDirty.current = true;
    });
  };

  const handleSaveChapter = () => {
    onSave({ ...chapter, hadiths });
    toast.success("Глава сохранена");
    onBack();
  };

  return (
    <motion.div
      key="chapter-editor"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="flex flex-col min-h-full"
    >
      <ConfirmDialog pending={pending} onConfirm={confirm} onCancel={cancel} />

      {/* Header */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3 border-b border-islamic-500/10">
        <button
          type="button"
          onClick={onBack}
          className="text-islamic-400 hover:text-islamic-300 transition-colors"
          data-ocid="admin.chapter.back_button"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Редактирование главы</p>
          <h3 className="text-sm font-bold text-foreground truncate">
            {chapter.title}
          </h3>
        </div>
        <Button
          size="sm"
          className="bg-islamic-500 text-black hover:bg-islamic-400 shrink-0"
          onClick={handleSaveChapter}
          data-ocid="admin.chapter.save_button"
        >
          Сохранить
        </Button>
      </div>

      <div className="flex-1 px-4 py-4 pb-24 space-y-4">
        {/* Hadith list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              {bookType === "quran_surah" ? "Аяты" : "Хадисы"} ({hadiths.length}
              )
            </h4>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs border-islamic-500/30 text-islamic-400 hover:bg-islamic-500/10"
              onClick={() => {
                setAddingHadith(true);
                setEditingHadithId(null);
              }}
              data-ocid="admin.hadith.add_button"
            >
              <Plus size={12} />
              Добавить
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {addingHadith && (
              <HadithForm
                key="add-hadith"
                nextNumber={hadiths.length + 1}
                onSave={handleSaveHadith}
                onCancel={() => setAddingHadith(false)}
              />
            )}
          </AnimatePresence>

          {hadiths.length === 0 && !addingHadith && (
            <div
              className="text-center py-8 rounded-xl border border-dashed border-islamic-500/20"
              data-ocid="admin.hadith.empty_state"
            >
              <p className="text-sm text-muted-foreground">Нет хадисов</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Нажмите «Добавить», чтобы создать первый хадис
              </p>
            </div>
          )}

          {hadiths.map((hadith, idx) => (
            <AnimatePresence key={hadith.id} initial={false}>
              {editingHadithId === hadith.id ? (
                <HadithForm
                  key={`edit-${hadith.id}`}
                  initial={hadith}
                  nextNumber={idx + 1}
                  onSave={handleSaveHadith}
                  onCancel={() => setEditingHadithId(null)}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="glass-card rounded-xl p-3 space-y-2"
                  data-ocid={`admin.hadith.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-islamic-400 font-semibold shrink-0">
                      №{hadith.number}
                    </span>
                    <p
                      className="text-sm text-right flex-1 leading-relaxed text-foreground/90"
                      style={{ fontFamily: "serif", direction: "rtl" }}
                    >
                      {hadith.arabic.slice(0, 80)}
                      {hadith.arabic.length > 80 ? "..." : ""}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingHadithId(hadith.id)}
                        className="w-7 h-7 rounded-lg bg-islamic-500/10 flex items-center justify-center text-islamic-400 hover:bg-islamic-500/20 transition-colors"
                        data-ocid={`admin.hadith.edit_button.${idx + 1}`}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHadith(hadith.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                        data-ocid={`admin.hadith.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {hadith.narrator && (
                    <p className="text-xs text-muted-foreground/60">
                      {hadith.narrator}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── BookContentEditor ────────────────────────────────────────────────────────
function BookContentEditor({
  book,
  onSave,
  onBack,
}: {
  book: CustomBook;
  onSave: (b: CustomBook) => void;
  onBack: () => void;
}) {
  const { pending, ask, confirm, cancel } = useConfirm();
  const [chapters, setChapters] = useState<CustomChapter[]>(
    book.chapters ?? [],
  );
  const [ayahs, setAyahs] = useState<CustomAyah[]>(book.ayahs ?? []);

  // Auto-save to parent whenever chapters or ayahs change (skip initial render)
  const isFirstRender = useRef(true);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const bookRef = useRef(book);
  bookRef.current = book;
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const b = bookRef.current;
    if (b.type === "quran_surah") {
      onSaveRef.current({ ...b, ayahs });
    } else if (b.type !== "pdf") {
      onSaveRef.current({ ...b, chapters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, ayahs]);

  // Chapter add/edit state
  const [addingChapter, setAddingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState<CustomChapter | null>(
    null,
  );
  const [selectedChapter, setSelectedChapter] = useState<CustomChapter | null>(
    null,
  );

  // Ayah add/edit state
  const [addingAyah, setAddingAyah] = useState(false);
  const [editingAyahId, setEditingAyahId] = useState<string | null>(null);

  // Chapter form state
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterTitleArabic, setChapterTitleArabic] = useState("");
  const [chapterErrors, setChapterErrors] = useState<Record<string, boolean>>(
    {},
  );

  const openChapterForm = (ch?: CustomChapter) => {
    if (ch) {
      setChapterTitle(ch.title);
      setChapterTitleArabic(ch.titleArabic ?? "");
    } else {
      setChapterTitle("");
      setChapterTitleArabic("");
    }
    setChapterErrors({});
    setEditingChapter(ch ?? null);
    setAddingChapter(!ch);
  };

  const handleSaveChapter = () => {
    const e: Record<string, boolean> = {};
    if (!chapterTitle.trim()) e.title = true;
    setChapterErrors(e);
    if (Object.keys(e).length > 0) return;

    if (editingChapter) {
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === editingChapter.id
            ? {
                ...ch,
                title: chapterTitle.trim(),
                titleArabic: chapterTitleArabic.trim() || undefined,
              }
            : ch,
        ),
      );
      setEditingChapter(null);
    } else {
      setChapters((prev) => [
        ...prev,
        {
          id: generateId(),
          title: chapterTitle.trim(),
          titleArabic: chapterTitleArabic.trim() || undefined,
          hadiths: [],
        },
      ]);
      setAddingChapter(false);
    }
    setChapterTitle("");
    setChapterTitleArabic("");
    toast.success("Глава сохранена");
  };

  const handleDeleteChapter = (id: string) => {
    ask("Удалить эту главу со всем содержимым?", () => {
      setChapters((prev) => prev.filter((ch) => ch.id !== id));
    });
  };

  const handleChapterContentSave = (updated: CustomChapter) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === updated.id ? updated : ch)),
    );
    setSelectedChapter(null);
  };

  const handleSaveAyah = (a: CustomAyah) => {
    setAyahs((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = a;
        return next;
      }
      return [...prev, a];
    });
    setAddingAyah(false);
    setEditingAyahId(null);
  };

  const handleDeleteAyah = (id: string) => {
    ask("Удалить этот аят?", () => {
      setAyahs((prev) => prev.filter((a) => a.id !== id));
    });
  };

  const handleSaveAll = () => {
    let updated: CustomBook;
    if (book.type === "quran_surah") {
      updated = { ...book, ayahs };
    } else if (book.type === "pdf") {
      updated = { ...book };
    } else {
      updated = { ...book, chapters };
    }
    onSave(updated);
    toast.success("Содержимое книги сохранено");
    onBack();
  };

  // If editing chapter content
  if (selectedChapter) {
    return (
      <ChapterEditor
        chapter={selectedChapter}
        bookType={book.type === "pdf" ? "general" : book.type}
        onSave={handleChapterContentSave}
        onBack={() => setSelectedChapter(null)}
      />
    );
  }

  return (
    <motion.div
      key="content-editor"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="flex flex-col min-h-full"
    >
      <ConfirmDialog pending={pending} onConfirm={confirm} onCancel={cancel} />

      {/* Header */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3 border-b border-islamic-500/10">
        <button
          type="button"
          onClick={onBack}
          className="text-islamic-400 hover:text-islamic-300 transition-colors"
          data-ocid="admin.content.back_button"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Содержимое книги</p>
          <h3 className="text-sm font-bold text-foreground truncate">
            {book.title}
          </h3>
        </div>
        <Button
          size="sm"
          className="bg-islamic-500 text-black hover:bg-islamic-400 shrink-0"
          onClick={handleSaveAll}
          data-ocid="admin.content.save_button"
        >
          Сохранить
        </Button>
      </div>

      <div className="flex-1 px-4 py-4 pb-24 space-y-4">
        {/* ── PDF book ── */}
        {book.type === "pdf" && (
          <div className="text-center py-8 rounded-xl border border-dashed border-islamic-500/20">
            <p className="text-sm text-muted-foreground">PDF книга</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Содержимое PDF загружено и доступно для чтения в разделе Книги
            </p>
          </div>
        )}

        {/* ── Quran surah: ayahs ── */}
        {book.type === "quran_surah" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Аяты ({ayahs.length})
              </h4>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-islamic-500/30 text-islamic-400 hover:bg-islamic-500/10"
                onClick={() => {
                  setAddingAyah(true);
                  setEditingAyahId(null);
                }}
                data-ocid="admin.ayah.add_button"
              >
                <Plus size={12} />
                Добавить аят
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {addingAyah && (
                <AyahForm
                  key="add-ayah"
                  nextNumber={ayahs.length + 1}
                  onSave={handleSaveAyah}
                  onCancel={() => setAddingAyah(false)}
                />
              )}
            </AnimatePresence>

            {ayahs.length === 0 && !addingAyah && (
              <div
                className="text-center py-8 rounded-xl border border-dashed border-islamic-500/20"
                data-ocid="admin.ayah.empty_state"
              >
                <p className="text-sm text-muted-foreground">Нет аятов</p>
              </div>
            )}

            {ayahs.map((ayah, idx) => (
              <AnimatePresence key={ayah.id} initial={false}>
                {editingAyahId === ayah.id ? (
                  <AyahForm
                    key={`edit-ayah-${ayah.id}`}
                    initial={ayah}
                    nextNumber={idx + 1}
                    onSave={handleSaveAyah}
                    onCancel={() => setEditingAyahId(null)}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card rounded-xl p-3 space-y-2"
                    data-ocid={`admin.ayah.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-islamic-400 font-semibold shrink-0">
                        {ayah.number}
                      </span>
                      <p
                        className="text-sm text-right flex-1 leading-relaxed text-foreground/90"
                        style={{ fontFamily: "serif", direction: "rtl" }}
                      >
                        {ayah.arabic.slice(0, 80)}
                        {ayah.arabic.length > 80 ? "..." : ""}
                      </p>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingAyahId(ayah.id)}
                          className="w-7 h-7 rounded-lg bg-islamic-500/10 flex items-center justify-center text-islamic-400 hover:bg-islamic-500/20 transition-colors"
                          data-ocid={`admin.ayah.edit_button.${idx + 1}`}
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAyah(ayah.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                          data-ocid={`admin.ayah.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      {ayah.translation.slice(0, 80)}
                      {ayah.translation.length > 80 ? "..." : ""}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>
        )}

        {/* ── Hadith / general: chapters ── */}
        {(book.type === "hadith" || book.type === "general") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Главы ({chapters.length})
              </h4>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-islamic-500/30 text-islamic-400 hover:bg-islamic-500/10"
                onClick={() => openChapterForm()}
                data-ocid="admin.chapter.add_button"
              >
                <Plus size={12} />
                Добавить главу
              </Button>
            </div>

            {/* Add/Edit chapter form */}
            <AnimatePresence initial={false}>
              {(addingChapter || editingChapter) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 rounded-xl overflow-hidden"
                  style={{
                    background: "oklch(0.15 0.025 45 / 0.5)",
                    padding: "1rem",
                  }}
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-islamic-400">
                      Название главы *
                    </p>
                    <Input
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="Книга откровения"
                      className={`bg-secondary/50 ${chapterErrors.title ? "border-red-500/70" : "border-islamic-500/20"}`}
                      data-ocid="admin.chapter.title.input"
                    />
                    {chapterErrors.title && (
                      <p
                        className="text-xs text-red-400"
                        data-ocid="admin.chapter.title.error_state"
                      >
                        Обязательное поле
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground/60">
                      Арабское название (необязательно)
                    </p>
                    <Input
                      value={chapterTitleArabic}
                      onChange={(e) => setChapterTitleArabic(e.target.value)}
                      placeholder="كتاب بدء الوحي"
                      className="bg-secondary/50 border-islamic-500/20 text-right"
                      style={{ direction: "rtl", fontFamily: "serif" }}
                      data-ocid="admin.chapter.arabic.input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-foreground/20"
                      onClick={() => {
                        setAddingChapter(false);
                        setEditingChapter(null);
                      }}
                      data-ocid="admin.chapter.cancel_button"
                    >
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-islamic-500 text-black hover:bg-islamic-400"
                      onClick={handleSaveChapter}
                      data-ocid="admin.chapter.form.save_button"
                    >
                      Сохранить
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {chapters.length === 0 && !addingChapter && (
              <div
                className="text-center py-8 rounded-xl border border-dashed border-islamic-500/20"
                data-ocid="admin.chapter.empty_state"
              >
                <p className="text-sm text-muted-foreground">Нет глав</p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Добавьте первую главу книги
                </p>
              </div>
            )}

            {chapters.map((chapter, idx) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-card rounded-xl overflow-hidden"
                data-ocid={`admin.chapter.item.${idx + 1}`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.55 0.18 45 / 0.15)" }}
                  >
                    <span className="text-xs font-bold text-islamic-400">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {chapter.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {chapter.hadiths.length} хадисов
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openChapterForm(chapter)}
                      className="w-7 h-7 rounded-lg bg-islamic-500/10 flex items-center justify-center text-islamic-400 hover:bg-islamic-500/20 transition-colors"
                      data-ocid={`admin.chapter.edit_button.${idx + 1}`}
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChapter(chapter)}
                      className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors"
                      data-ocid={`admin.chapter.open_modal_button.${idx + 1}`}
                      title="Редактировать хадисы"
                    >
                      <ChevronRight size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                      data-ocid={`admin.chapter.delete_button.${idx + 1}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── BookForm ─────────────────────────────────────────────────────────────────
function BookForm({
  initial,
  onSave,
  onBack,
}: {
  initial?: CustomBook;
  onSave: (b: CustomBook) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleArabic, setTitleArabic] = useState(initial?.titleArabic ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverColor, setCoverColor] = useState(
    initial?.coverColor ?? COVER_COLORS[0],
  );
  const [type, setType] = useState<
    "hadith" | "quran_surah" | "general" | "pdf"
  >((initial?.type === "pdf" ? "general" : initial?.type) ?? "hadith");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!title.trim()) e.title = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        id: initial?.id ?? generateId(),
        title: title.trim(),
        titleArabic: titleArabic.trim() || undefined,
        description: description.trim() || undefined,
        coverColor,
        type,
        chapters: initial?.chapters ?? [],
        ayahs: initial?.ayahs ?? [],
      });
      setSaving(false);
    }, 100);
  };

  const typeOptions: {
    value: "hadith" | "quran_surah" | "general";
    label: string;
  }[] = [
    { value: "hadith", label: "Сборник хадисов" },
    { value: "quran_surah", label: "Сура Корана" },
    { value: "general", label: "Общая книга" },
  ];

  return (
    <motion.div
      key="book-form"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="flex flex-col min-h-full"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3 border-b border-islamic-500/10">
        <button
          type="button"
          onClick={onBack}
          className="text-islamic-400 hover:text-islamic-300 transition-colors"
          data-ocid="admin.bookform.back_button"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-sm font-bold text-foreground flex-1">
          {initial ? "Редактировать книгу" : "Новая книга"}
        </h3>
        <Button
          size="sm"
          className="bg-islamic-500 text-black hover:bg-islamic-400 shrink-0"
          onClick={handleSave}
          disabled={saving}
          data-ocid="admin.bookform.save_button"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "Сохранить"
          )}
        </Button>
      </div>

      <div className="flex-1 px-4 py-5 pb-24 space-y-5">
        {/* Preview */}
        <div className="flex justify-center">
          <div
            className="w-32 h-40 rounded-2xl flex items-center justify-center shadow-xl border border-white/10 overflow-hidden relative"
            style={{ background: coverColor }}
          >
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/30 to-transparent" />
            <div className="text-center text-white space-y-1 relative z-10 px-3">
              <p
                className="font-bold text-xs leading-tight"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              >
                {title || "Название"}
              </p>
              {titleArabic && (
                <p
                  className="text-[10px] opacity-70 leading-tight"
                  style={{ direction: "rtl", fontFamily: "serif" }}
                >
                  {titleArabic}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-islamic-400">
            Название книги *
          </p>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Сорок хадисов о намазе"
            className={`bg-secondary/50 ${errors.title ? "border-red-500/70" : "border-islamic-500/20"}`}
            data-ocid="admin.bookform.title.input"
          />
          {errors.title && (
            <p
              className="text-xs text-red-400"
              data-ocid="admin.bookform.title.error_state"
            >
              Обязательное поле
            </p>
          )}
        </div>

        {/* Arabic title */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground/60">
            Арабское название (необязательно)
          </p>
          <Input
            value={titleArabic}
            onChange={(e) => setTitleArabic(e.target.value)}
            placeholder="أربعون حديثاً في الصلاة"
            className="bg-secondary/50 border-islamic-500/20 text-right"
            style={{ direction: "rtl", fontFamily: "serif" }}
            data-ocid="admin.bookform.arabic.input"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground/60">
            Описание (необязательно)
          </p>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание книги..."
            className="bg-secondary/50 border-islamic-500/20 resize-none"
            rows={3}
            data-ocid="admin.bookform.description.textarea"
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-islamic-400">Тип книги</p>
          <div className="grid grid-cols-3 gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`rounded-xl px-3 py-3 text-center text-xs font-semibold border transition-all duration-200 ${
                  type === opt.value
                    ? "bg-islamic-500/20 border-islamic-500/50 text-islamic-400"
                    : "bg-secondary/30 border-foreground/10 text-muted-foreground hover:border-islamic-500/20"
                }`}
                data-ocid={`admin.bookform.type.${opt.value}.button`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cover color */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-islamic-400">Цвет обложки</p>
          <div className="flex gap-2 flex-wrap">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCoverColor(color)}
                className={`w-9 h-9 rounded-xl border-2 transition-all duration-200 ${
                  coverColor === color
                    ? "border-islamic-400 scale-110 shadow-lg"
                    : "border-transparent hover:border-islamic-400/40"
                }`}
                style={{ background: color }}
                data-ocid="admin.bookform.color.button"
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── BooksList ────────────────────────────────────────────────────────────────
function BooksList({
  books,
  onAdd,
  onEdit,
  onEditContent,
  onDelete,
  onPublish,
}: {
  books: CustomBook[];
  onAdd: () => void;
  onEdit: (b: CustomBook) => void;
  onEditContent: (b: CustomBook) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string, published: boolean) => void;
}) {
  const seedBooks = books.filter((b) => SEED_BOOK_IDS.includes(b.id));
  const customBooksOnly = books.filter((b) => !SEED_BOOK_IDS.includes(b.id));

  const renderBookCard = (book: CustomBook, idx: number, isSeed: boolean) => (
    <motion.div
      key={book.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="glass-card rounded-2xl overflow-hidden"
      data-ocid={`admin.books.item.${idx + 1}`}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Cover preview */}
        <div
          className="w-12 h-16 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
          style={{ background: book.coverColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <BookOpen size={16} className="text-white/80 relative z-10" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {book.title}
          </p>
          {book.titleArabic && (
            <p
              className="text-xs text-islamic-400/70 truncate"
              style={{ direction: "rtl", fontFamily: "serif" }}
            >
              {book.titleArabic}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-islamic-500/10 text-islamic-400 font-medium">
              {book.type === "hadith"
                ? "Хадисы"
                : book.type === "quran_surah"
                  ? "Сура"
                  : book.type === "pdf"
                    ? "PDF"
                    : "Книга"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {book.type === "quran_surah"
                ? `${book.ayahs?.length ?? 0} аятов`
                : book.type === "pdf"
                  ? "Документ"
                  : `${book.chapters?.length ?? 0} глав`}
            </span>
            {isSeed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-medium">
                базовая
              </span>
            )}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${book.published ? "bg-green-500/15 text-green-400" : "bg-gray-500/10 text-gray-400"}`}
            >
              {book.published ? "Опубликована" : "Не опубликована"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(book)}
            className="w-8 h-8 rounded-lg bg-islamic-500/10 flex items-center justify-center text-islamic-400 hover:bg-islamic-500/20 transition-colors"
            title="Редактировать метаданные"
            data-ocid={`admin.books.edit_button.${idx + 1}`}
          >
            <Edit size={13} />
          </button>
          <button
            type="button"
            onClick={() => onEditContent(book)}
            className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors"
            title="Редактировать содержимое"
            data-ocid={`admin.books.open_modal_button.${idx + 1}`}
          >
            <BookOpen size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPublish(book.id, !book.published)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${book.published ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"}`}
            title={
              book.published
                ? "Скрыть от пользователей"
                : "Опубликовать для всех"
            }
            data-ocid={`admin.books.toggle_button.${idx + 1}`}
          >
            {book.published ? (
              <span style={{ fontSize: "11px", fontWeight: "bold" }}>✓</span>
            ) : (
              <span style={{ fontSize: "11px" }}>○</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(book.id)}
            className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
            title="Удалить книгу"
            data-ocid={`admin.books.delete_button.${idx + 1}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 px-4 py-4 pb-24 space-y-4">
      {/* Action buttons row */}
      <div className="flex">
        <Button
          className="w-full bg-islamic-500/15 border border-islamic-500/30 text-islamic-400 hover:bg-islamic-500/25 h-11 font-semibold gap-2"
          variant="outline"
          onClick={onAdd}
          data-ocid="admin.books.add_button"
        >
          <Plus size={16} />
          Добавить
        </Button>
      </div>

      {/* Empty state */}
      {books.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 glass-card rounded-2xl"
          data-ocid="admin.books.empty_state"
        >
          <BookOpen size={32} className="text-islamic-400/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Нет книг</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Создайте первую книгу
          </p>
        </motion.div>
      )}

      {/* ── Seed / базовые книги ── */}
      {seedBooks.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-islamic-500/10" />
            <span className="text-[10px] text-muted-foreground/50 font-medium px-2">
              Исламская библиотека ({seedBooks.length})
            </span>
            <div className="h-px flex-1 bg-islamic-500/10" />
          </div>
          <div className="space-y-3">
            {seedBooks.map((book, idx) => renderBookCard(book, idx, true))}
          </div>
        </>
      )}

      {/* ── Добавленные администратором книги ── */}
      {customBooksOnly.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px flex-1 bg-islamic-500/10" />
            <span className="text-[10px] text-muted-foreground/50 font-medium px-2">
              Добавленные книги ({customBooksOnly.length})
            </span>
            <div className="h-px flex-1 bg-islamic-500/10" />
          </div>
          <div className="space-y-3">
            {customBooksOnly.map((book, idx) =>
              renderBookCard(book, seedBooks.length + idx, false),
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main AdminBooksEditor ────────────────────────────────────────────────────
type EditorView =
  | { type: "list" }
  | { type: "add" }
  | { type: "edit"; book: CustomBook }
  | { type: "content"; book: CustomBook };

export default function AdminBooksEditor({
  onBack,
}: {
  onBack: () => void;
}) {
  const isAdmin = useIsAdmin();
  const { pending, ask, confirm, cancel } = useConfirm();
  const [books, setBooks] = useState<CustomBook[]>(() => getCustomBooks());
  const [view, setView] = useState<EditorView>({ type: "list" });
  // Persist books to localStorage on change
  useEffect(() => {
    saveCustomBooks(books);
  }, [books]);

  // Hard guard — only admin can use this
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4 px-4">
        <BookOpen size={32} className="text-red-400/50" />
        <p className="text-sm text-center text-muted-foreground">
          Доступ запрещён. Только администратор.
        </p>
      </div>
    );
  }

  const handleSaveBook = (b: CustomBook) => {
    setBooks((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = b;
        return next;
      }
      return [...prev, b];
    });
    toast.success(
      view.type === "add" ? "Книга добавлена!" : "Книга обновлена!",
    );
    setView({ type: "list" });
  };

  const handleSaveContent = (b: CustomBook) => {
    setBooks((prev) => prev.map((x) => (x.id === b.id ? b : x)));
  };

  const handlePublishBook = (id: string, published: boolean) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, published } : b)),
    );
    toast.success(
      published
        ? "Книга опубликована — видна всем пользователям"
        : "Книга скрыта от пользователей",
    );
  };

  const handleDeleteBook = (id: string) => {
    ask("Удалить книгу и все её содержимое навсегда?", () => {
      setBooks((prev) => prev.filter((b) => b.id !== id));
      toast.success("Книга удалена");
    });
  };

  return (
    <div className="flex flex-col min-h-full">
      <ConfirmDialog pending={pending} onConfirm={confirm} onCancel={cancel} />

      {/* Top header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-islamic-400 hover:text-islamic-300 transition-colors"
            data-ocid="admin.books.back_button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-gradient-orange">
              Управление книгами
            </h1>
            <p className="text-xs text-muted-foreground">
              Только для администратора
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view.type === "list" && (
          <motion.div
            key="list"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <BooksList
              books={books}
              onAdd={() => setView({ type: "add" })}
              onEdit={(b) => setView({ type: "edit", book: b })}
              onEditContent={(b) => setView({ type: "content", book: b })}
              onDelete={handleDeleteBook}
              onPublish={handlePublishBook}
            />
          </motion.div>
        )}

        {view.type === "add" && (
          <motion.div
            key="add"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <BookForm
              onSave={handleSaveBook}
              onBack={() => setView({ type: "list" })}
            />
          </motion.div>
        )}

        {view.type === "edit" && (
          <motion.div
            key="edit"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <BookForm
              initial={view.book}
              onSave={handleSaveBook}
              onBack={() => setView({ type: "list" })}
            />
          </motion.div>
        )}

        {view.type === "content" && (
          <motion.div
            key="content"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <BookContentEditor
              book={view.book}
              onSave={handleSaveContent}
              onBack={() => setView({ type: "list" })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
