import Link from "next/link";
import {
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
} from "./Icons";

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/matthewmalan8/",
    Icon: InstagramIcon,
  },
  {
    label: "Twitter / X",
    href: "https://x.com/matthewmalan8",
    Icon: XIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/matthew-malan8/",
    Icon: LinkedInIcon,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@matthewmalan7",
    Icon: TikTokIcon,
  },
];

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
              E-commerce consultant helping founders scale to six figures.
              Host of the Stay Hungry Podcast.
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
            <a
              href="mailto:matthewsmalan@gmail.com"
              className="mt-4 inline-block text-sm hover:text-[var(--color-yellow)] transition-colors"
            >
              matthewsmalan@gmail.com
            </a>
            <ul className="mt-4 flex flex-wrap gap-3 items-center">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-off-white)] border border-[var(--color-warm-gray)]/40 text-[var(--color-black)] hover:scale-110 transition-transform"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--color-warm-gray)]/20 text-sm text-[var(--color-warm-gray)] space-y-3">
          <p className="text-xs italic">
            As an Amazon Associate, I earn from qualifying purchases.
          </p>
          <p>&copy; {year} Matthew Malan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
