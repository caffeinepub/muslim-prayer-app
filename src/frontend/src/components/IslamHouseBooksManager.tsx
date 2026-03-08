import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Edit,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type IslamHouseBook,
  generateIslamHouseId,
  getIslamHouseBooksAsync,
  saveIslamHouseBooksAsync,
} from "../data/islamhouseBooks";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Акыда",
  "Фикх",
  "Сира",
  "Ахляк",
  "Дуа",
  "Хадисы",
  "Тафсир",
  "Другое",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_COVER_SIZE = 2 * 1024 * 1024; // 2 MB

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          data-ocid="islamhouse.delete.dialog"
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
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-foreground/20"
                onClick={onCancel}
                data-ocid="islamhouse.delete.cancel_button"
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={onConfirm}
                data-ocid="islamhouse.delete.confirm_button"
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

// ─── File reader helper ───────────────────────────────────────────────────────
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Book form (create / edit) ────────────────────────────────────────────────
function BookForm({
  initial,
  onSave,
  onBack,
}: {
  initial?: IslamHouseBook;
  onSave: (book: IslamHouseBook) => void;
  onBack: () => void;
}) {
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleRu, setTitleRu] = useState(initial?.titleRu ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [coverImage, setCoverImage] = useState<string | undefined>(
    initial?.coverImage,
  );
  const [fileAr, setFileAr] = useState<string | undefined>(initial?.fileAr);
  const [fileArName, setFileArName] = useState<string | undefined>(
    initial?.fileArName,
  );
  const [fileRu, setFileRu] = useState<string | undefined>(initial?.fileRu);
  const [fileRuName, setFileRuName] = useState<string | undefined>(
    initial?.fileRuName,
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loadingCover, setLoadingCover] = useState(false);
  const [loadingAr, setLoadingAr] = useState(false);
  const [loadingRu, setLoadingRu] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const fileArRef = useRef<HTMLInputElement>(null);
  const fileRuRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!titleAr.trim()) e.titleAr = true;
    if (!titleRu.trim()) e.titleRu = true;
    if (!author.trim()) e.author = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCoverChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (file.size > MAX_COVER_SIZE) {
        toast.error("Обложка слишком большая (максимум 2 МБ)");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Пожалуйста, загрузите изображение (JPG, PNG, WebP)");
        return;
      }
      setLoadingCover(true);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setCoverImage(dataUrl);
        toast.success("Обложка загружена");
      } catch {
        toast.error("Не удалось загрузить обложку");
      } finally {
        setLoadingCover(false);
      }
    },
    [],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, lang: "ar" | "ru") => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const isPdf =
        file.name.toLowerCase().endsWith(".pdf") ||
        file.type === "application/pdf";
      const isEpub =
        file.name.toLowerCase().endsWith(".epub") ||
        file.type === "application/epub+zip";
      if (!isPdf && !isEpub) {
        toast.error("Поддерживаются только форматы PDF и EPUB");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Файл слишком большой (максимум 50 МБ)");
        return;
      }
      const setLoading = lang === "ar" ? setLoadingAr : setLoadingRu;
      setLoading(true);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (lang === "ar") {
          setFileAr(dataUrl);
          setFileArName(file.name);
          toast.success("Файл на арабском загружен");
        } else {
          setFileRu(dataUrl);
          setFileRuName(file.name);
          toast.success("Файл на русском загружен");
        }
      } catch {
        toast.error("Не удалось загрузить файл");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSave = () => {
    if (!validate()) {
      toast.error("Заполните обязательные поля");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const book: IslamHouseBook = {
        id: initial?.id ?? generateIslamHouseId(),
        titleAr: titleAr.trim(),
        titleRu: titleRu.trim(),
        author: author.trim(),
        category: category.trim() || "Другое",
        coverImage,
        fileAr,
        fileArName,
        fileRu,
        fileRuName,
        createdAt: initial?.createdAt ?? Date.now(),
      };
      onSave(book);
      setSaving(false);
    }, 80);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3 border-b border-islamic-500/10">
        <button
          type="button"
          onClick={onBack}
          className="text-islamic-400 hover:text-islamic-300 transition-colors"
          data-ocid="islamhouse.form.back_button"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-sm font-bold text-foreground flex-1">
          {initial ? "Редактировать книгу" : "Загрузить книгу"}
        </h3>
        <Button
          size="sm"
          className="bg-islamic-500 text-black hover:bg-islamic-400 shrink-0"
          onClick={handleSave}
          disabled={saving}
          data-ocid="islamhouse.form.save_button"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "Сохранить"
          )}
        </Button>
      </div>

      <div className="flex-1 px-4 py-5 pb-32 space-y-5">
        {/* Cover image */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-28 h-36 rounded-2xl overflow-hidden border-2 flex items-center justify-center shrink-0"
            style={{
              borderColor: coverImage
                ? "rgba(var(--islamic-500), 0.4)"
                : "rgba(255,255,255,0.08)",
              background: coverImage
                ? "transparent"
                : "oklch(0.18 0.02 240 / 0.6)",
            }}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt="Обложка"
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen size={28} className="text-foreground/20" />
            )}
          </div>
          <input
            ref={coverRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverChange}
            data-ocid="islamhouse.cover.upload_button"
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-foreground/15 text-foreground/70 text-xs"
            onClick={() => coverRef.current?.click()}
            disabled={loadingCover}
            data-ocid="islamhouse.cover.button"
          >
            {loadingCover ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ImagePlus size={13} />
            )}
            {coverImage ? "Заменить обложку" : "Загрузить обложку"}
          </Button>
        </div>

        {/* Arabic title */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-islamic-400">
            Название на арабском *
          </p>
          <Input
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder="عنوان الكتاب"
            className={`bg-secondary/50 text-right ${errors.titleAr ? "border-red-500/70" : "border-islamic-500/20"}`}
            style={{ direction: "rtl", fontFamily: "serif" }}
            data-ocid="islamhouse.form.titlear.input"
          />
          {errors.titleAr && (
            <p
              className="text-xs text-red-400"
              data-ocid="islamhouse.form.titlear.error_state"
            >
              Обязательное поле
            </p>
          )}
        </div>

        {/* Russian title */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-islamic-400">
            Название на русском *
          </p>
          <Input
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            placeholder="Название книги на русском"
            className={`bg-secondary/50 ${errors.titleRu ? "border-red-500/70" : "border-islamic-500/20"}`}
            data-ocid="islamhouse.form.titleru.input"
          />
          {errors.titleRu && (
            <p
              className="text-xs text-red-400"
              data-ocid="islamhouse.form.titleru.error_state"
            >
              Обязательное поле
            </p>
          )}
        </div>

        {/* Author */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-islamic-400">Автор *</p>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Имя автора"
            className={`bg-secondary/50 ${errors.author ? "border-red-500/70" : "border-islamic-500/20"}`}
            data-ocid="islamhouse.form.author.input"
          />
          {errors.author && (
            <p
              className="text-xs text-red-400"
              data-ocid="islamhouse.form.author.error_state"
            >
              Обязательное поле
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-islamic-400">Категория</p>
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-xl px-2 py-2 text-center text-[10px] font-semibold border transition-all duration-150 ${
                  category === cat
                    ? "bg-islamic-500/20 border-islamic-500/50 text-islamic-400"
                    : "bg-secondary/30 border-foreground/10 text-muted-foreground hover:border-islamic-500/20"
                }`}
                data-ocid="islamhouse.form.category.button"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Arabic file */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-islamic-400">
            Файл на арабском (PDF / EPUB)
          </p>
          <input
            ref={fileArRef}
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            className="hidden"
            onChange={(e) => handleFileChange(e, "ar")}
            data-ocid="islamhouse.filear.upload_button"
          />
          {fileAr && fileArName ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 border border-islamic-500/20"
              style={{ background: "oklch(0.18 0.02 240 / 0.4)" }}
            >
              <FileText size={15} className="text-islamic-400 shrink-0" />
              <span className="text-xs text-foreground/80 flex-1 truncate">
                {fileArName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-foreground/50 hover:text-foreground gap-1"
                onClick={() => fileArRef.current?.click()}
                disabled={loadingAr}
              >
                {loadingAr ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Заменить
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-foreground/15 text-foreground/60 justify-start"
              onClick={() => fileArRef.current?.click()}
              disabled={loadingAr}
              data-ocid="islamhouse.filear.button"
            >
              {loadingAr ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              Загрузить файл на арабском
            </Button>
          )}
        </div>

        {/* Russian file */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-islamic-400">
            Файл на русском (PDF / EPUB)
          </p>
          <input
            ref={fileRuRef}
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            className="hidden"
            onChange={(e) => handleFileChange(e, "ru")}
            data-ocid="islamhouse.fileru.upload_button"
          />
          {fileRu && fileRuName ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 border border-islamic-500/20"
              style={{ background: "oklch(0.18 0.02 240 / 0.4)" }}
            >
              <FileText size={15} className="text-islamic-400 shrink-0" />
              <span className="text-xs text-foreground/80 flex-1 truncate">
                {fileRuName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-foreground/50 hover:text-foreground gap-1"
                onClick={() => fileRuRef.current?.click()}
                disabled={loadingRu}
              >
                {loadingRu ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Заменить
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-foreground/15 text-foreground/60 justify-start"
              onClick={() => fileRuRef.current?.click()}
              disabled={loadingRu}
              data-ocid="islamhouse.fileru.button"
            >
              {loadingRu ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              Загрузить файл на русском
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Books list ───────────────────────────────────────────────────────────────
function BooksList({
  books,
  onAdd,
  onEdit,
  onDelete,
}: {
  books: IslamHouseBook[];
  onAdd: () => void;
  onEdit: (book: IslamHouseBook) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex-1 px-4 py-4 pb-24 space-y-4">
      {/* Add button */}
      <Button
        className="w-full bg-islamic-500/15 border border-islamic-500/30 text-islamic-400 hover:bg-islamic-500/25 h-11 font-semibold gap-2"
        variant="outline"
        onClick={onAdd}
        data-ocid="islamhouse.books.add_button"
      >
        <Plus size={16} />
        Загрузить книгу
      </Button>

      {/* Empty state */}
      {books.length === 0 && (
        <div
          className="text-center py-12 glass-card rounded-2xl border border-dashed border-islamic-500/15"
          data-ocid="islamhouse.books.empty_state"
        >
          <BookOpen size={32} className="text-islamic-400/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Нет книг IslamHouse</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Нажмите «Загрузить книгу», чтобы добавить первую
          </p>
        </div>
      )}

      {/* Book cards */}
      <div className="space-y-3">
        {books.map((book, idx) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="glass-card rounded-2xl overflow-hidden"
            data-ocid={`islamhouse.books.item.${idx + 1}`}
          >
            <div className="flex items-center gap-3 p-4">
              {/* Cover */}
              <div
                className="w-12 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{
                  background: book.coverImage
                    ? "transparent"
                    : `hsl(${(idx * 47) % 360}, 45%, 25%)`,
                }}
              >
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.titleRu}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen size={18} className="text-white/60" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-semibold text-sm text-foreground truncate">
                  {book.titleRu}
                </p>
                <p
                  className="text-xs text-islamic-400/80 truncate"
                  style={{ direction: "rtl", fontFamily: "serif" }}
                >
                  {book.titleAr}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {book.author}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-islamic-500/10 text-islamic-400 font-medium">
                    {book.category}
                  </span>
                  {book.fileAr && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-medium">
                      ع PDF
                    </span>
                  )}
                  {book.fileRu && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-medium">
                      RU PDF
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(book)}
                  className="w-8 h-8 rounded-lg bg-islamic-500/10 flex items-center justify-center text-islamic-400 hover:bg-islamic-500/20 transition-colors"
                  title="Редактировать"
                  data-ocid={`islamhouse.books.edit_button.${idx + 1}`}
                >
                  <Edit size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(book.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Удалить"
                  data-ocid={`islamhouse.books.delete_button.${idx + 1}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main IslamHouseBooksManager ──────────────────────────────────────────────
type ManagerView =
  | { type: "list" }
  | { type: "add" }
  | { type: "edit"; book: IslamHouseBook };

export default function IslamHouseBooksManager({
  onBack,
}: {
  onBack: () => void;
}) {
  const [books, setBooks] = useState<IslamHouseBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ManagerView>({ type: "list" });
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const pendingDeleteId = useRef<string | null>(null);

  // Load books from IndexedDB on mount
  useEffect(() => {
    setIsLoading(true);
    getIslamHouseBooksAsync()
      .then((loaded) => setBooks(loaded))
      .catch(() => setBooks([]))
      .finally(() => setIsLoading(false));
  }, []);

  const persistBooks = async (updated: IslamHouseBook[]): Promise<boolean> => {
    setBooks(updated);
    const saved = await saveIslamHouseBooksAsync(updated);
    // Notify BooksTab (same tab) to refresh its list
    window.dispatchEvent(new CustomEvent("islamhouse-books-updated"));
    return saved;
  };

  const handleSave = (book: IslamHouseBook) => {
    const existing = books.findIndex((b) => b.id === book.id);
    let updated: IslamHouseBook[];
    if (existing >= 0) {
      updated = books.map((b) => (b.id === book.id ? book : b));
    } else {
      updated = [...books, book];
    }
    void persistBooks(updated).then((saved) => {
      if (saved) {
        toast.success(existing >= 0 ? "Книга обновлена" : "Книга добавлена");
      } else {
        toast.warning(
          "Не удалось сохранить книгу в IndexedDB. Попробуйте снова.",
          { duration: 6000 },
        );
      }
    });
    setView({ type: "list" });
  };

  const askDelete = (id: string) => {
    pendingDeleteId.current = id;
    setConfirmMessage("Удалить эту книгу навсегда?");
  };

  const confirmDelete = () => {
    if (!pendingDeleteId.current) return;
    const updated = books.filter((b) => b.id !== pendingDeleteId.current);
    void persistBooks(updated);
    toast.success("Книга удалена");
    pendingDeleteId.current = null;
    setConfirmMessage(null);
  };

  return (
    <div className="flex flex-col min-h-full">
      <ConfirmDialog
        message={confirmMessage}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmMessage(null)}
      />

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-islamic-400 hover:text-islamic-300 transition-colors"
            data-ocid="islamhouse.back_button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-gradient-orange">
              Книги IslamHouse
            </h1>
            <p className="text-xs text-muted-foreground">
              Загрузка книг с файлами PDF/EPUB
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view.type === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col"
          >
            {isLoading ? (
              <div
                className="flex flex-col items-center justify-center flex-1 gap-3 py-16"
                data-ocid="islamhouse.books.loading_state"
              >
                <Loader2 size={28} className="text-islamic-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Загрузка книг…</p>
              </div>
            ) : (
              <BooksList
                books={books}
                onAdd={() => setView({ type: "add" })}
                onEdit={(book) => setView({ type: "edit", book })}
                onDelete={askDelete}
              />
            )}
          </motion.div>
        )}

        {view.type === "add" && (
          <motion.div
            key="add"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col"
          >
            <BookForm
              onSave={handleSave}
              onBack={() => setView({ type: "list" })}
            />
          </motion.div>
        )}

        {view.type === "edit" && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col"
          >
            <BookForm
              initial={view.book}
              onSave={handleSave}
              onBack={() => setView({ type: "list" })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── File viewer overlay (used by BooksTab) ───────────────────────────────────
export function IslamHouseFileViewer({
  file,
  name,
  onClose,
}: {
  file: string;
  name: string;
  onClose: () => void;
}) {
  const isPdf =
    name.toLowerCase().endsWith(".pdf") ||
    file.startsWith("data:application/pdf");

  // Convert base64 data URL to Blob URL for iframe rendering
  // Browsers block data: URLs in iframes for security reasons
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!isPdf) return;

    try {
      const commaIdx = file.indexOf(",");
      if (commaIdx === -1) {
        // Not a data URL — use as-is (e.g., already a blob or http URL)
        setBlobUrl(file);
        return;
      }
      const base64 = file.slice(commaIdx + 1);
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      // Fallback: use the data URL directly
      setBlobUrl(file);
    }
  }, [file, isPdf]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
      data-ocid="islamhouse.viewer.panel"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 glass-card border-b border-foreground/5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
          data-ocid="islamhouse.viewer.close_button"
        >
          <X size={18} />
        </button>
        <p className="text-sm font-medium text-foreground truncate flex-1">
          {name}
        </p>
        {/* Download link always available for PDF */}
        {isPdf && (
          <a
            href={blobUrl ?? file}
            download={name}
            className="flex items-center gap-1.5 text-xs text-islamic-400 hover:text-islamic-300 transition-colors"
            data-ocid="islamhouse.viewer.download.button"
          >
            <Download size={15} />
            Скачать
          </a>
        )}
        {!isPdf && (
          <a
            href={file}
            download={name}
            className="flex items-center gap-1.5 text-xs text-islamic-400 hover:text-islamic-300 transition-colors"
            data-ocid="islamhouse.viewer.download.button"
          >
            <Download size={15} />
            Скачать
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isPdf ? (
          blobUrl === null ? (
            // Loading state while converting to blob URL
            <div
              className="flex flex-col items-center justify-center h-full gap-3"
              data-ocid="islamhouse.viewer.loading_state"
            >
              <Loader2 size={32} className="text-islamic-400 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Загрузка документа…
              </p>
            </div>
          ) : pdfError ? (
            // Fallback if iframe fails to load
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <div
                className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-4"
                data-ocid="islamhouse.viewer.error_state"
              >
                <FileText size={40} className="text-islamic-400 mx-auto" />
                <div>
                  <p className="font-bold text-foreground text-base">
                    Не удалось открыть PDF
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Скачайте файл, чтобы открыть его
                  </p>
                </div>
                <a
                  href={blobUrl}
                  download={name}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-islamic-500/15 border border-islamic-500/30 text-islamic-400 text-sm font-semibold hover:bg-islamic-500/25 transition-colors"
                  data-ocid="islamhouse.viewer.download.button"
                >
                  <Download size={16} />
                  Скачать PDF
                </a>
              </div>
            </div>
          ) : (
            <iframe
              key={blobUrl}
              src={blobUrl}
              className="w-full h-full border-0"
              title={name}
              onError={() => setPdfError(true)}
              data-ocid="islamhouse.viewer.editor"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
            <div
              className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-4"
              data-ocid="islamhouse.viewer.card"
            >
              <FileText size={40} className="text-islamic-400 mx-auto" />
              <div>
                <p className="font-bold text-foreground text-base">EPUB файл</p>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {name}
                </p>
              </div>
              <a
                href={file}
                download={name}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-islamic-500/15 border border-islamic-500/30 text-islamic-400 text-sm font-semibold hover:bg-islamic-500/25 transition-colors"
                data-ocid="islamhouse.viewer.download.button"
              >
                <Download size={16} />
                Скачать EPUB
              </a>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
