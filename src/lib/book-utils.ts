export type BookFrontmatter = {
  title: string;
  author: string;
  coverImage: string;
  coverImageAlt: string;
  rating: number;
  readOn: string;
  amazonLink: string;
  tags: string[];
};

export type BookMeta = BookFrontmatter & { slug: string };

export type Book = BookMeta & { reviewHtml: string };

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
        (a, b) => new Date(b.readOn).getTime() - new Date(a.readOn).getTime()
      );
      break;
    case "oldest":
      out.sort(
        (a, b) => new Date(a.readOn).getTime() - new Date(b.readOn).getTime()
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
      return new Date(b.book.readOn).getTime() - new Date(a.book.readOn).getTime();
    });
  return scored.slice(0, limit).map((s) => s.book);
}
