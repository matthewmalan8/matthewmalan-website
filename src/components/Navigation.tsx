import Link from "next/link";
import { useRouter } from "next/router";

const links = [
  { href: "/speaking/", label: "Speaking" },
  { href: "/podcast/", label: "Podcast" },
  { href: "/about/", label: "About" },
];

export default function Navigation() {
  const { pathname } = useRouter();
  const isActive = (href: string) =>
    pathname === href.replace(/\/$/, "") || pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-off-white)] border-b border-[var(--color-warm-gray)]">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-black)] hover:text-[var(--color-black)]/80 transition-colors"
        >
          Matthew Malan
        </Link>

        <div className="flex items-center gap-2 md:gap-8">
          <ul className="hidden md:flex items-center gap-8 text-sm font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`transition-colors hover:text-[var(--color-black)] ${
                    isActive(link.href)
                      ? "text-[var(--color-black)]"
                      : "text-[var(--color-black)]/60"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/contact/"
            className="inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-5 py-2.5 text-sm font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </nav>
    </header>
  );
}
