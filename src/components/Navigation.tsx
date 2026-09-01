import Link from "next/link";

export default function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-off-white)] border-b border-[var(--color-warm-gray)]">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-black)] hover:text-[var(--color-black)]/80 transition-colors"
        >
          Matthew Malan
        </Link>
      </nav>
    </header>
  );
}
