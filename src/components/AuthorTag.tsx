import Link from "next/link";
import { authorSlug } from "@/lib/book-utils";

type Props = {
  name: string;
  photo?: string;
  photoAlt?: string;
  size?: "sm" | "md" | "lg";
  // Visual style override. "inline" matches body text, "block" is a
  // standalone chip with stronger styling.
  variant?: "inline" | "block";
};

const SIZE = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

function Initials({ name, sizeClass }: { name: string; sizeClass: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={`flex-shrink-0 rounded-full bg-[var(--color-warm-gray)]/40 text-[var(--color-black)]/70 font-semibold inline-flex items-center justify-center ${sizeClass}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export default function AuthorTag({
  name,
  photo,
  photoAlt,
  size = "md",
  variant = "inline",
}: Props) {
  if (!name) return null;
  const sizeClass = SIZE[size];
  const slug = authorSlug(name);

  const avatar = photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt={photoAlt || name}
      className={`flex-shrink-0 rounded-full object-cover ring-1 ring-[var(--color-warm-gray)] ${sizeClass}`}
      loading="lazy"
    />
  ) : (
    <Initials name={name} sizeClass={sizeClass} />
  );

  return (
    <Link
      href={`/books/author/${slug}/`}
      className={`inline-flex items-center gap-2 group ${
        variant === "block"
          ? "px-3 py-1.5 rounded-full ring-1 ring-[var(--color-warm-gray)] hover:ring-[var(--color-black)] transition-colors"
          : ""
      }`}
      title={`See all books by ${name}`}
    >
      {avatar}
      <span className="underline decoration-[var(--color-warm-gray)] decoration-1 underline-offset-2 group-hover:decoration-[var(--color-black)]">
        {name}
      </span>
    </Link>
  );
}
