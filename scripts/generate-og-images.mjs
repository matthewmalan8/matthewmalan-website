#!/usr/bin/env node
// Generates branded 1200x630 OG cards for top-level pages into public/og/*.png.
// Uses satori (JSX -> SVG) + @resvg/resvg-js (SVG -> PNG). Reads Inter + Space
// Grotesk WOFFs directly from @fontsource packages in node_modules.

import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const COLORS = {
  black: "#1C1400",
  yellow: "#FFD721",
  offWhite: "#FFFDF9",
  lime: "#88FF00",
  warmGray: "#D0CBC4",
};

// Fonts ship with the @fontsource packages — we just read the latin WOFF
// directly from node_modules. Satori accepts WOFF/TTF/OTF.
const FONT_PATHS = {
  inter600: path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "inter",
    "files",
    "inter-latin-600-normal.woff"
  ),
  spaceGrotesk700: path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "space-grotesk",
    "files",
    "space-grotesk-latin-700-normal.woff"
  ),
};

function loadFont(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`Font not found: ${p}. Run pnpm install.`);
  }
  return fs.readFileSync(p);
}

const pages = [
  {
    slug: "home",
    kicker: "Matthew Malan",
    title: "I'll be back.",
    subtitle: "The site is on pause for now.",
  },
];

function card({ kicker, title, subtitle }) {
  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: COLORS.black,
        color: COLORS.offWhite,
        fontFamily: "Space Grotesk",
        position: "relative",
      },
      children: [
        // Top row — kicker + brand
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "Inter",
              fontSize: 26,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: COLORS.yellow,
              fontWeight: 600,
            },
            children: [
              { type: "span", props: { children: kicker } },
              {
                type: "span",
                props: {
                  style: { color: COLORS.warmGray },
                  children: "matthewmalan.com",
                },
              },
            ],
          },
        },
        // Center — headline + subtitle
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 24 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 84,
                    lineHeight: 1.05,
                    fontWeight: 700,
                    letterSpacing: -1.5,
                    color: COLORS.offWhite,
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: 30,
                    lineHeight: 1.35,
                    color: COLORS.warmGray,
                    maxWidth: 920,
                  },
                  children: subtitle,
                },
              },
            ],
          },
        },
        // Bottom accent bar
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: 16 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: 64,
                    height: 8,
                    backgroundColor: COLORS.yellow,
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: 24,
                    height: 8,
                    backgroundColor: COLORS.lime,
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: 22,
                    color: COLORS.warmGray,
                    fontWeight: 600,
                  },
                  children: "Matthew Malan",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function main() {
  const inter600 = loadFont(FONT_PATHS.inter600);
  const spaceGrotesk700 = loadFont(FONT_PATHS.spaceGrotesk700);

  const fonts = [
    { name: "Inter", data: inter600, weight: 600, style: "normal" },
    {
      name: "Space Grotesk",
      data: spaceGrotesk700,
      weight: 700,
      style: "normal",
    },
  ];

  const outDir = path.join(process.cwd(), "public", "og");
  fs.mkdirSync(outDir, { recursive: true });

  for (const page of pages) {
    const svg = await satori(card(page), {
      width: 1200,
      height: 630,
      fonts,
    });
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
      .render()
      .asPng();
    fs.writeFileSync(path.join(outDir, `${page.slug}.png`), png);
  }

  console.log(`[og] Wrote ${pages.length} OG cards → public/og/`);
}

main().catch((err) => {
  console.error("[og] Failed:", err);
  process.exit(1);
});
