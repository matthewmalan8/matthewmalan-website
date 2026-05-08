import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-black)] text-[var(--color-off-white)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
              Matthew Malan
            </p>
            <p className="mt-3 text-[var(--color-warm-gray)] max-w-sm">
              Public speaker and podcast host. Conversations about leadership,
              creativity, and the work that matters.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-yellow)]">
              Site
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/speaking/" className="hover:text-[var(--color-yellow)] transition-colors">Speaking</Link></li>
              <li><Link href="/podcast/" className="hover:text-[var(--color-yellow)] transition-colors">Podcast</Link></li>
              <li><Link href="/about/" className="hover:text-[var(--color-yellow)] transition-colors">About</Link></li>
              <li><Link href="/contact/" className="hover:text-[var(--color-yellow)] transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-yellow)]">
              Connect
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="mailto:hello@matthewmalan.com" className="hover:text-[var(--color-yellow)] transition-colors">hello@matthewmalan.com</a></li>
              <li><a href="https://twitter.com/matthewmalan" className="hover:text-[var(--color-yellow)] transition-colors">Twitter</a></li>
              <li><a href="https://linkedin.com/in/matthewmalan" className="hover:text-[var(--color-yellow)] transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--color-warm-gray)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-[var(--color-warm-gray)]">
          <p>&copy; {year} Matthew Malan. All rights reserved.</p>
          <p>Built with care.</p>
        </div>
      </div>
    </footer>
  );
}
