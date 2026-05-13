export type ReadingMeta = { date: string };
export type Reading = { date: string; notesHtml: string };

export type BookFrontmatter = {
  title: string;
  author: string;
  coverImage: string;
  coverImageAlt: string;
  rating: number;
  amazonLink: string;
  tags: string[];
};

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

export function ratingStars(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

export function getRelatedBooks(
  current: BookMeta,
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
