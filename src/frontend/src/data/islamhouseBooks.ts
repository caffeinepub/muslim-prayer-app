// ─── IslamHouse Books — IndexedDB-backed store ───────────────────────────────
// Uses IndexedDB for large PDF/EPUB files, localStorage for metadata index.

export interface IslamHouseBook {
  id: string;
  titleAr: string; // Arabic title
  titleRu: string; // Russian title
  author: string;
  category: string;
  coverImage?: string; // base64 data URL (JPG/PNG/WebP) — stored in IndexedDB
  fileAr?: string; // base64 data URL (PDF or EPUB) — stored in IndexedDB
  fileArName?: string; // original filename with extension
  fileRu?: string; // base64 data URL (PDF or EPUB) — stored in IndexedDB
  fileRuName?: string; // original filename with extension
  createdAt: number; // timestamp
}

// ─── Lightweight metadata (no file data) ─────────────────────────────────────
export interface IslamHouseBookMeta {
  id: string;
  titleAr: string;
  titleRu: string;
  author: string;
  category: string;
  fileArName?: string;
  fileRuName?: string;
  createdAt: number;
  hasCover: boolean;
  hasFileAr: boolean;
  hasFileRu: boolean;
}

const DB_NAME = "friday_app_db";
const DB_VERSION = 1;
const STORE_NAME = "islamhouse_books";
const META_KEY = "islamhouse_books_meta";

// ─── Open IndexedDB ────────────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Save all books to IndexedDB ──────────────────────────────────────────────
export async function saveIslamHouseBooksAsync(
  books: IslamHouseBook[],
): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Clear existing records then write new ones
    await new Promise<void>((res, rej) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => res();
      clearReq.onerror = () => rej(clearReq.error);
    });

    for (const book of books) {
      await new Promise<void>((res, rej) => {
        const putReq = store.put(book);
        putReq.onsuccess = () => res();
        putReq.onerror = () => rej(putReq.error);
      });
    }

    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });

    // Save lightweight meta to localStorage for fast listing
    const meta: IslamHouseBookMeta[] = books.map((b) => ({
      id: b.id,
      titleAr: b.titleAr,
      titleRu: b.titleRu,
      author: b.author,
      category: b.category,
      fileArName: b.fileArName,
      fileRuName: b.fileRuName,
      createdAt: b.createdAt,
      hasCover: !!b.coverImage,
      hasFileAr: !!b.fileAr,
      hasFileRu: !!b.fileRu,
    }));
    localStorage.setItem(META_KEY, JSON.stringify(meta));

    db.close();
    return true;
  } catch {
    return false;
  }
}

// ─── Get all books meta (fast, no file data) ──────────────────────────────────
export function getIslamHouseBooksMeta(): IslamHouseBookMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as IslamHouseBookMeta[];
  } catch {
    return [];
  }
}

// ─── Get all books with file data from IndexedDB ──────────────────────────────
export async function getIslamHouseBooksAsync(): Promise<IslamHouseBook[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const books = await new Promise<IslamHouseBook[]>((res, rej) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result as IslamHouseBook[]);
      req.onerror = () => rej(req.error);
    });

    db.close();
    // Sort by createdAt
    return books.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

// ─── Get a single book by id (with file data) ─────────────────────────────────
export async function getIslamHouseBookById(
  id: string,
): Promise<IslamHouseBook | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const book = await new Promise<IslamHouseBook | null>((res, rej) => {
      const req = store.get(id);
      req.onsuccess = () => res((req.result as IslamHouseBook) ?? null);
      req.onerror = () => rej(req.error);
    });

    db.close();
    return book;
  } catch {
    return null;
  }
}

// ─── Legacy sync helpers (kept for backward compatibility) ────────────────────
// These read from the old localStorage key and are used for migration
export function getIslamHouseBooks(): IslamHouseBook[] {
  // Return meta objects — file data must be fetched async via getIslamHouseBookById
  // This exists for backward compat; prefer getIslamHouseBooksMeta()
  try {
    const raw = localStorage.getItem("islamhouse_books");
    if (raw) {
      const old = JSON.parse(raw) as IslamHouseBook[];
      if (old.length > 0) return old;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveIslamHouseBooks(_books: IslamHouseBook[]): boolean {
  // No-op: use saveIslamHouseBooksAsync instead
  return true;
}

export function generateIslamHouseId(): string {
  return `ih_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
