import Link from "next/link";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { getSpeeches, type Speech } from "@/lib/speeches";

const topics = [
  {
    title: "From Stutter to Stage",
    description:
      "The story of how I went from a debilitating childhood stutter to speaking on stages around the world — and the universal lessons it taught me about resilience, the human spirit, and finding the voice you didn't know you had.",
    duration: "45 min keynote",
  },
  {
    title: "Scale to Six Figures",
    description:
      "A practical playbook for e-commerce operators and online founders ready to break past plateaus. Covers the offer, the funnel, the team, and the mindset shifts that separate side hustles from real businesses.",
    duration: "60 min keynote or 90 min workshop",
  },
];

type Props = {
  speeches: Speech[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const cache = getSpeeches();
  return { props: { speeches: cache.videos } };
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SpeechCard({ speech }: { speech: Speech }) {
  return (
    <a
      href={speech.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-[var(--color-off-white)] rounded-xl overflow-hidden ring-1 ring-[var(--color-warm-gray)]/30 hover:ring-[var(--color-yellow)] hover:shadow-2xl transition-all"
    >
      <div className="relative aspect-video bg-[var(--color-warm-gray)]/20 overflow-hidden">
        {speech.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={speech.thumbnail}
            alt={speech.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-black)]/10 group-hover:bg-[var(--color-black)]/40 transition-colors">
          <span className="w-12 h-12 rounded-full bg-[var(--color-yellow)] text-[var(--color-black)] flex items-center justify-center opacity-95 group-hover:scale-110 transition-transform shadow-lg">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 ml-0.5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
        {speech.videoPublishedAt && (
          <span className="absolute bottom-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[var(--color-black)]/75 text-[var(--color-off-white)] backdrop-blur-sm">
            {formatDate(speech.videoPublishedAt)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-[family-name:var(--font-display)] text-base tracking-tight leading-tight text-[var(--color-black)] line-clamp-2 min-h-[2.5rem]">
          {speech.title}
        </h3>
      </div>
    </a>
  );
}

export default function SpeakingPage({ speeches }: Props) {
  return (
    <Layout
      title="Speaking"
      description="Keynotes on resilience, the human spirit, and scaling e-commerce businesses by Matthew Malan."
      path="/speaking/"
      ogImage="/og/speaking.png"
    >
      {/* HERO */}
      <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <h1 className="text-6xl sm:text-8xl lg:text-[10rem] leading-[0.9] tracking-tight">
            <span className="inline-block relative">
              Speaking
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-2 lg:-bottom-3 h-3 lg:h-4 bg-[var(--color-yellow)]"
              />
            </span>
          </h1>
          <p className="mt-12 text-xl lg:text-2xl max-w-2xl text-[var(--color-black)]/70">
            Keynotes on resilience, the human spirit, and what it really takes
            to scale a business to six figures and beyond.
          </p>
        </div>
      </section>

      {/* TOPIC CARDS */}
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 lg:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((t, i) => (
              <article
                key={i}
                className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-8 lg:p-10 flex flex-col"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                  Topic 0{i + 1}
                </p>
                <h2 className="mt-4 text-3xl lg:text-4xl tracking-tight">
                  <span className="inline-block relative">
                    {t.title}
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 -bottom-1 h-2 bg-[var(--color-yellow)]"
                    />
                  </span>
                </h2>
                <p className="mt-6 text-base text-[var(--color-black)]/70 leading-relaxed flex-1">
                  {t.description}
                </p>
                <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/60">
                  {t.duration}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SPEECHES (pulled live from YouTube playlist) */}
      {speeches.length > 0 && (
        <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
                  Watch me speak
                </p>
                <h2 className="mt-4 text-3xl lg:text-5xl tracking-tight max-w-2xl">
                  Every talk, every stage — all in one place.
                </h2>
              </div>
              <a
                href={`https://www.youtube.com/playlist?list=PL1wWJyVcgZeUrQCKpjyEH7oggv8OMH47y`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-semibold text-[var(--color-yellow)] hover:underline self-start sm:self-auto"
              >
                Open playlist on YouTube →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {speeches.map((s) => (
                <SpeechCard key={s.videoId} speech={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[var(--color-yellow)] text-[var(--color-black)]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
          <h2 className="text-5xl sm:text-7xl lg:text-8xl tracking-tight">
            Want me on your stage?
          </h2>
          <p className="mt-6 text-xl lg:text-2xl text-[var(--color-black)]/80 max-w-2xl mx-auto">
            Tell me about the audience, the moment, and what you want them
            walking out thinking.
          </p>
          <Link
            href="/contact/"
            className="mt-12 inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-8 py-5 text-lg font-semibold rounded-full hover:bg-[var(--color-off-white)] hover:text-[var(--color-black)] transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </Layout>
  );
}
