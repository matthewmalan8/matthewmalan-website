import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CloseIcon, MenuIcon } from "./Icons";

const links = [
  { href: "/speaking/", label: "Speaking" },
  { href: "/podcast/", label: "Podcast" },
  { href: "/books/", label: "Books" },
  { href: "/dropshipping/", label: "Dropshipping" },
  { href: "/about/", label: "About" },
];

export default function Navigation() {
  const { pathname } = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    const normalized = href.replace(/\/$/, "");
    return pathname === normalized || pathname.startsWith(`${normalized}/`);
  };

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-off-white)] border-b border-[var(--color-warm-gray)]">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-black)] hover:text-[var(--color-black)]/80 transition-colors"
        >
          Matthew Malan
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-8 text-sm font-medium">
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

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-[var(--color-black)]"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            <CloseIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu drawer */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-warm-gray)] bg-[var(--color-off-white)]">
          <ul className="px-6 py-4 space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 text-lg font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-[var(--color-black)]"
                      : "text-[var(--color-black)]/70 hover:text-[var(--color-black)]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 pb-2">
              <Link
                href="/contact/"
                onClick={() => setOpen(false)}
                className="inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-5 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors"
              >
                Get in touch
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
