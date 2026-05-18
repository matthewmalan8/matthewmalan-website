export type ReadingMeta = { date: string; videoUrl: string; hasNotes: boolean };
export type Reading = {
  date: string;
  notesHtml: string;
  videoUrl: string;
};

export type BookFrontmatter = {
  title: string;
  author: string;
  authorPhoto: string;
  authorPhotoAlt: string;
  coverImage: string;
  coverImageAlt: string;
  rating: number;
  amazonLink: string;
  tags: string[];
};

// Used in URLs for /books/author/<slug>/ and for grouping books by author.
// Lowercase, alphanumeric, hyphenated. "James Clear" -> "james-clear".
export function authorSlug(author: string): string {
  return author
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type BookMeta = BookFrontmatter & {
  slug: string;
  readings: ReadingMeta[];
  lastReadOn: string;
};

export type Book = BookFrontmatter & {
  slug: string;
  readings: Reading[];
  lastReadOn: string;
};

export type BookSort =
  | "recent"
  | "oldest"
  | "highest"
  | "lowest"
  | "title-az";

export const BOOK_SORTS: Array<{ value: BookSort; label: string }> = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
  { value: "title-az", label: "Title (A–Z)" },
];

export function sortBooks(books: BookMeta[], by: BookSort): BookMeta[] {
  const out = [...books];
  switch (by) {
    case "recent":
      out.sort(
        (a, b) =>
          new Date(b.lastReadOn).getTime() - new Date(a.lastReadOn).getTime()
      );
      break;
    case "oldest":
      out.sort(
        (a, b) =>
          new Date(a.lastReadOn).getTime() - new Date(b.lastReadOn).getTime()
      );
      break;
    case "highest":
      out.sort((a, b) => b.rating - a.rating);
      break;
    case "lowest":
      out.sort((a, b) => a.rating - b.rating);
      break;
    case "title-az":
      out.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return out;
}

export function formatReadOn(date: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getRelatedBooks(
  current: { slug: string; tags: string[] },
  all: BookMeta[],
  limit = 3
): BookMeta[] {
  const others = all.filter((b) => b.slug !== current.slug);
  const currentTags = new Set(current.tags);
  const scored = others
    .map((b) => ({
      book: b,
      score: b.tags.filter((t) => currentTags.has(t)).length,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.book.lastReadOn).getTime() -
        new Date(a.book.lastReadOn).getTime()
      );
    });
  return scored.slice(0, limit).map((s) => s.book);
}

export function getAllBookTags(books: BookMeta[]): string[] {
  const set = new Set<string>();
  for (const b of books) for (const t of b.tags) set.add(t);
  return Array.from(set).sort();
}

export type AuthorSummary = {
  name: string;
  slug: string;
  photo: string;
  photoAlt: string;
  bookCount: number;
  // Authors we've read sorted descending by score (shared tags).
  sharedTags: string[];
};

// For the author page: find other authors whose books share tags with
// the current author's books. Score = number of distinct shared tags
// between any of their books and any of ours. Tiebreak by how many of
// their books I've read (more = more confident recommendation).
export function getRelatedAuthors(
  currentAuthor: string,
  allBooks: BookMeta[],
  limit = 4
): AuthorSummary[] {
  const currentSlug = authorSlug(currentAuthor);
  if (!currentSlug) return [];

  // Collect tags from this author's books.
  const currentTags = new Set<string>();
  for (const b of allBooks) {
    if (authorSlug(b.author) !== currentSlug) continue;
    for (const t of b.tags) currentTags.add(t);
  }
  if (currentTags.size === 0) return [];

  // Group every OTHER author's books and compute their tag union.
  type Bucket = {
    name: string;
    slug: string;
    photo: string;
    photoAlt: string;
    books: BookMeta[];
    tags: Set<string>;
  };
  const buckets = new Map<string, Bucket>();
  for (const b of allBooks) {
    const slug = authorSlug(b.author);
    if (!slug || slug === currentSlug) continue;
    let bucket = buckets.get(slug);
    if (!bucket) {
      bucket = {
        name: b.author,
        slug,
        photo: "",
        photoAlt: "",
        books: [],
        tags: new Set(),
      };
      buckets.set(slug, bucket);
    }
    bucket.books.push(b);
    if (!bucket.photo && b.authorPhoto) {
      bucket.photo = b.authorPhoto;
      bucket.photoAlt = b.authorPhotoAlt;
    }
    for (const t of b.tags) bucket.tags.add(t);
  }

  const scored = Array.from(buckets.values())
    .map((bucket) => {
      const shared: string[] = [];
      for (const t of bucket.tags) {
        if (currentTags.has(t)) shared.push(t);
      }
      return { bucket, shared };
    })
    .filter((x) => x.shared.length > 0)
    .sort((a, b) => {
      if (b.shared.length !== a.shared.length) {
        return b.shared.length - a.shared.length;
      }
      return b.bucket.books.length - a.bucket.books.length;
    });

  return scored.slice(0, limit).map(({ bucket, shared }) => ({
    name: bucket.name,
    slug: bucket.slug,
    photo: bucket.photo,
    photoAlt: bucket.photoAlt,
    bookCount: bucket.books.length,
    sharedTags: shared,
  }));
}
