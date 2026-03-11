import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── API config ─────────────────────────────────────────────────────────────────
const HADITH_API_KEY =
  "$2y$10$MhDjrpF4OyjWLpebfplbee7dRPjklplQA05CSedooohFKXs1a";
const HADITH_BASE = "https://hadithapi.com/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HadithBook {
  id: number;
  bookName: string;
  writerName: string;
  aboutWriter: string | null;
  writersName: string;
  slug: string;
  hadithCount: number;
}

interface HadithItem {
  id: number;
  hadithNumber: string;
  englishNarrator: string;
  hadithEnglish: string;
  hadithUrdu: string;
  headingEnglish: string;
  headingUrdu: string;
  headingArabic: string;
  hadithArabic: string;
  status: string;
  book: {
    bookName: string;
    writerName: string;
    slug: string;
  };
  chapter: {
    chapterEnglish: string;
    chapterUrdu: string;
    chapterArabic: string;
  };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────────
const BOOKS_CACHE_KEY = "hadith_books_v1";

function getCachedBooks(): HadithBook[] | null {
  try {
    const raw = localStorage.getItem(BOOKS_CACHE_KEY);
    if (raw) return JSON.parse(raw) as HadithBook[];
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedBooks(books: HadithBook[]) {
  try {
    localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(books));
  } catch {
    /* storage full */
  }
}

// Перевод названий книг на русский
const BOOK_NAME_RU: Record<string, string> = {
  "sahih-bukhari": "Сахих аль-Бухари",
  "sahih-muslim": "Сахих Муслима",
  "al-tirmidhi": "Сунан атт-Тирмизи",
  "abu-dawood": "Сунан Абу Давуда",
  "ibn-e-majah": "Сунан Ибн Маджи",
  "an-nasai": "Сунан ан-Насаи",
  "mishkat-ul-masabih": "Мишкат аль-Масабих",
  "musnad-ahmad": "Муснад Ахмада",
  "al-silsila-sahiha": "аль-Сильсила ас-Сахиха",
  "riyad-us-saliheen": "Рияд ас-Салихин",
  "al-adab-al-mufrad": "Аль-Адаб аль-Муфрад",
  "bulugh-al-maram": "Булуг аль-Марам",
};

function getBookNameRu(slug: string, fallback: string): string {
  return BOOK_NAME_RU[slug] ?? fallback;
}

// ─── Hadith detail card ──────────────────────────────────────────────────────────────
function HadithCard({ hadith, index }: { hadith: HadithItem; index: number }) {
  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid oklch(var(--islamic-500) / 0.15)",
      }}
      data-ocid={`hadith.card.item.${index + 1}`}
    >
      {/* Chapter/heading */}
      {hadith.chapter?.chapterEnglish && (
        <div
          className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-2 py-1 rounded-md inline-block"
          style={{
            background: "oklch(var(--islamic-500) / 0.12)",
            color: "oklch(var(--islamic-500) / 0.9)",
          }}
        >
          {hadith.chapter.chapterArabic || hadith.chapter.chapterEnglish}
        </div>
      )}

      {/* Arabic text */}
      {hadith.hadithArabic && (
        <p
          className="text-right leading-loose mb-3 text-base"
          style={{
            fontFamily: "serif",
            direction: "rtl",
            color: "oklch(0.95 0.01 80)",
            lineHeight: "2",
          }}
        >
          {hadith.hadithArabic}
        </p>
      )}

      {/* English text */}
      {hadith.hadithEnglish && (
        <p
          className="text-sm leading-relaxed mb-2"
          style={{ color: "oklch(0.85 0.015 265)" }}
        >
          {hadith.hadithEnglish}
        </p>
      )}

      {/* Narrator + number */}
      <div
        className="flex items-center justify-between mt-2 pt-2"
        style={{ borderTop: "1px solid oklch(var(--islamic-500) / 0.1)" }}
      >
        {hadith.englishNarrator && (
          <span
            className="text-xs"
            style={{ color: "oklch(var(--islamic-500) / 0.7)" }}
          >
            {hadith.englishNarrator}
          </span>
        )}
        <span
          className="text-[10px] ml-auto px-2 py-0.5 rounded-full"
          style={{
            background: "oklch(var(--islamic-500) / 0.1)",
            color: "oklch(var(--islamic-500) / 0.8)",
          }}
        >
          #{hadith.hadithNumber}
        </span>
      </div>
    </div>
  );
}

// ─── Book detail view (list of hadiths) ────────────────────────────────────────
function HadithBookView({
  book,
  onBack,
}: { book: HadithBook; onBack: () => void }) {
  const [hadiths, setHadiths] = useState<HadithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);

  const PER_PAGE = 50;

  async function loadPage(pageNum: number, reset = false) {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      const url = `${HADITH_BASE}/${book.slug}/hadiths?apiKey=${encodeURIComponent(HADITH_API_KEY)}&paginate=${PER_PAGE}&page=${pageNum}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: HadithItem[] = data?.hadiths?.data ?? [];
      const nextPage: number | null = data?.hadiths?.next_page_url
        ? pageNum + 1
        : null;
      if (reset) {
        setHadiths(items);
        setTotalLoaded(items.length);
      } else {
        setHadiths((prev) => {
          const updated = [...prev, ...items];
          setTotalLoaded(updated.length);
          return updated;
        });
      }
      setHasMore(!!nextPage);
      setPage(pageNum);
    } catch {
      setError("Не удалось загрузить хадисы. Проверьте подключение.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load on mount
  useEffect(() => {
    loadPage(1, true);
  }, [book.slug]);

  // Auto-load next pages when there are more hadiths to fetch
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional auto-load
  useEffect(() => {
    if (!loading && !loadingMore && hasMore) {
      loadPage(page + 1);
    }
  }, [hasMore, loading, loadingMore]);

  const filtered = search.trim()
    ? hadiths.filter(
        (h) =>
          h.hadithEnglish?.toLowerCase().includes(search.toLowerCase()) ||
          h.englishNarrator?.toLowerCase().includes(search.toLowerCase()) ||
          h.hadithArabic?.includes(search) ||
          h.hadithNumber?.includes(search),
      )
    : hadiths;

  const bookNameRu = getBookNameRu(book.slug, book.bookName);
  const isLoadingAll = !loading && loadingMore && hasMore;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "oklch(0.10 0.018 265)" }}
      data-ocid="hadith.book.panel"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{
          background: "oklch(0.10 0.018 265 / 0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(var(--islamic-500) / 0.15)",
        }}
      >
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium shrink-0"
          style={{ color: "oklch(var(--islamic-500))" }}
          onClick={onBack}
          data-ocid="hadith.book.back_button"
        >
          <ArrowLeft size={17} />
          <span>Назад</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-foreground">
            {bookNameRu}
          </p>
          <p className="text-[10px] text-foreground/40">
            {book.writerName} ·{" "}
            <span
              className="font-semibold"
              style={{ color: "oklch(var(--islamic-500) / 0.8)" }}
            >
              {book.hadithCount.toLocaleString("ru")} хадисов
            </span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
          />
          <Input
            placeholder="Поиск по тексту, передатчику..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-secondary border-border"
            data-ocid="hadith.search_input"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-24">
        {loading && (
          <div
            className="flex flex-col items-center py-16 gap-3"
            data-ocid="hadith.loading_state"
          >
            <Loader2 size={28} className="animate-spin text-islamic-500" />
            <p className="text-sm text-foreground/50">Загрузка хадисов...</p>
            <p className="text-xs text-foreground/30">
              Источник: hadithapi.com
            </p>
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-2xl p-5 text-center mt-4"
            style={{
              background: "rgba(244,67,54,0.07)",
              border: "1px solid rgba(244,67,54,0.2)",
            }}
            data-ocid="hadith.error_state"
          >
            <p className="text-sm" style={{ color: "#ef5350" }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            className="text-center py-12 text-foreground/30"
            data-ocid="hadith.empty_state"
          >
            <p className="text-sm">Ничего не найдено</p>
          </div>
        )}

        {!loading &&
          filtered.map((h, i) => (
            <HadithCard key={h.id} hadith={h} index={i} />
          ))}

        {/* Background loading progress indicator */}
        {isLoadingAll && (
          <div
            className="flex flex-col items-center py-6 gap-2"
            data-ocid="hadith.loading_state"
          >
            <div className="flex items-center gap-2">
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: "oklch(var(--islamic-500))" }}
              />
              <p
                className="text-xs font-medium"
                style={{ color: "oklch(var(--islamic-500) / 0.8)" }}
              >
                Загрузка... {totalLoaded} из {book.hadithCount} хадисов
              </p>
            </div>
            <div
              className="w-full max-w-xs h-1 rounded-full overflow-hidden"
              style={{ background: "oklch(var(--islamic-500) / 0.1)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (totalLoaded / Math.max(1, book.hadithCount)) * 100)}%`,
                  background: "oklch(var(--islamic-500))",
                }}
              />
            </div>
          </div>
        )}

        {/* All loaded indicator */}
        {!loading && !loadingMore && !hasMore && hadiths.length > 0 && (
          <div className="text-center py-4" data-ocid="hadith.success_state">
            <p
              className="text-xs"
              style={{ color: "oklch(var(--islamic-500) / 0.5)" }}
            >
              Все {hadiths.length} хадисов загружены
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main HadithView (books list) ─────────────────────────────────────────────────────
interface HadithViewProps {
  onBack: () => void;
}

export default function HadithView({ onBack }: HadithViewProps) {
  const [books, setBooks] = useState<HadithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<HadithBook | null>(null);

  useEffect(() => {
    async function loadBooks() {
      // Check cache first
      const cached = getCachedBooks();
      if (cached && cached.length > 0) {
        setBooks(cached);
        setLoading(false);
        return;
      }
      try {
        const url = `${HADITH_BASE}/books?apiKey=${encodeURIComponent(HADITH_API_KEY)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const bookList: HadithBook[] = data?.books ?? [];
        setBooks(bookList);
        setCachedBooks(bookList);
      } catch {
        setError(
          "Не удалось загрузить список книг. Проверьте подключение к интернету.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  if (selectedBook) {
    return (
      <HadithBookView
        book={selectedBook}
        onBack={() => setSelectedBook(null)}
      />
    );
  }

  return (
    <div className="flex flex-col px-4 py-4" data-ocid="hadith.list.panel">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "oklch(var(--islamic-500))" }}
          onClick={onBack}
          data-ocid="hadith.list.back_button"
        >
          <ArrowLeft size={17} />
          <span>Назад</span>
        </button>
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <BookOpen size={15} className="text-islamic-500" />
            <h2 className="text-lg font-display font-bold text-gradient-orange">
              Хадисы
            </h2>
            <BookOpen size={15} className="text-islamic-500" />
          </div>
          <p className="text-foreground/40 text-[10px] mt-0.5">
            Источник: Hadith API
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="flex flex-col items-center py-16 gap-3"
          data-ocid="hadith.list.loading_state"
        >
          <Loader2 size={28} className="animate-spin text-islamic-500" />
          <p className="text-sm text-foreground/50">Загрузка...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: "rgba(244,67,54,0.07)",
            border: "1px solid rgba(244,67,54,0.2)",
          }}
          data-ocid="hadith.list.error_state"
        >
          <p className="text-sm" style={{ color: "#ef5350" }}>
            {error}
          </p>
        </div>
      )}

      {/* Books list */}
      {!loading && !error && (
        <div className="space-y-2 pb-4">
          {books.map((book, idx) => {
            const nameRu = getBookNameRu(book.slug, book.bookName);
            return (
              <button
                type="button"
                key={book.id}
                className="w-full glass-card rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-islamic-500/30 transition-all duration-200 text-left group"
                onClick={() => setSelectedBook(book)}
                data-ocid={`hadith.book.item.${idx + 1}`}
              >
                {/* Number badge */}
                <div className="w-9 h-9 rounded-lg bg-islamic-500/10 border border-islamic-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-islamic-400">
                    {idx + 1}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {nameRu}
                  </p>
                  <p className="text-xs text-foreground/40 truncate">
                    {book.writerName} · {book.hadithCount.toLocaleString("ru")}{" "}
                    хадисов
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  className="text-foreground/30 group-hover:text-islamic-400 transition-colors shrink-0"
                />
              </button>
            );
          })}

          {books.length === 0 && !error && (
            <div
              className="text-center py-12 text-foreground/30"
              data-ocid="hadith.list.empty_state"
            >
              <p className="text-sm">Книги не найдены</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
