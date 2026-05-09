# Matthew Malan Website

## Project Overview
Personal website for Matthew Malan, public speaker and podcast host. Static site hosted on AWS (S3 + CloudFront).

## Tech Stack
- Next.js (latest stable) with TypeScript
- Tailwind CSS v4
- pnpm (package manager — never use npm or yarn)
- Static export (output: 'export' in next.config)
- Dev server runs on port 3400

## Project Structure
- src/pages/ — page components
- src/components/ — reusable components (Header, Footer, Layout)
- src/lib/ — utility functions and SEO config
- src/styles/globals.css — global styles
- content/ — markdown files for page content (parsed with gray-matter)
- content/blog/ — blog posts (markdown with YAML frontmatter)
- public/images/ — static images (all WebP, optimized)
- public/fonts/ — self-hosted font files
- scripts/ — build and deploy scripts

## Brand Identity
Colors:
- Black: #1C1400 (primary backgrounds, dark text)
- Yellow: #FFD721 (primary accent, headline highlights, CTAs)
- Off-White: #FFFDF9 (light section backgrounds, body text on dark)
- Lime: #88FF00 (secondary accent, hover states, callouts)
- Warm Gray: #D0CBC4 (borders, muted text, dividers)

Typography:
- Space Grotesk — headlines, display text (weight 700)
- Inter — body text and subheads (weights 400, 500, 600)

## Content Rules
- Use `-` for bullet points in markdown, never `*`
- Blog posts use YAML frontmatter (title, date, excerpt, image, imageAlt, author, category, tags)
- All images must be WebP format, max 800px width for content, 480px for mobile variants
- All URLs use trailing slashes in sitemap

## Deployment
- Build: `pnpm build` (outputs to `out/` directory)
- Deploy: `pnpm run deploy:aws` (syncs to S3 + invalidates CloudFront cache)
- Always commit to GitHub before deploying
- Deploy command: git add + commit + push, then deploy:aws

## Commands
- `pnpm dev` — start dev server on localhost:3400
- `pnpm build` — build static export
- `pnpm run deploy:aws` — deploy to production

## External Services
- Contact form: Formspree endpoint https://formspree.io/f/mbdwzagr

## Important
- Do exactly what is asked. Don't add extra actions.
- Always preview changes on the dev server before deploying.
- No hardcoded data where a config or content file should be used.
- Test the build (pnpm build) before deploying to catch errors early.
