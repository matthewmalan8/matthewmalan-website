#!/usr/bin/env node
// Fetches every video in the Speaking playlist via YouTube Data API v3
// and caches them in content/speaking/cache/speeches.json. The Speaking
// page reads that cache at build time and renders each video as a card.
//
// Required env var (set as a GitHub Actions secret):
//   YOUTUBE_API_KEY
//
// If the key is missing the script writes an empty cache and exits 0 so
// local builds without credentials still succeed.
//
// See docs/youtube-playlist-setup.md for one-time setup.

import fs from "node:fs";
import path from "node:path";

// Hardcoded playlist — Matthew's "Speeches" playlist on YouTube.
// To change which playlist powers /speaking, update this ID.
const PLAYLIST_ID = "PL1wWJyVcgZeUrQCKpjyEH7oggv8OMH47y";

const cacheDir = path.join(process.cwd(), "content", "speaking", "cache");
const outPath = path.join(cacheDir, "speeches.json");

function writeEmpty(reason) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), videos: [] },
      null,
      2
    )
  );
  console.log(`[youtube] ${reason} — wrote empty cache.`);
}

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  writeEmpty("Missing YOUTUBE_API_KEY");
  process.exit(0);
}

function pickThumb(thumbs = {}) {
  // Largest available wins. maxres isn't generated for every video.
  return (
    thumbs.maxres?.url ??
    thumbs.standard?.url ??
    thumbs.high?.url ??
    thumbs.medium?.url ??
    thumbs.default?.url ??
    null
  );
}

try {
  const videos = [];
  let pageToken = null;

  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails,status");
    url.searchParams.set("playlistId", PLAYLIST_ID);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`${res.status} ${await res.text()}`);
    }
    const data = await res.json();

    for (const item of data.items ?? []) {
      const snip = item.snippet ?? {};
      const videoId = item.contentDetails?.videoId ?? snip.resourceId?.videoId;
      const privacy = item.status?.privacyStatus;

      // Skip private / deleted videos — they're noise on the public page.
      if (!videoId || privacy === "private" || snip.title === "Private video") {
        continue;
      }

      videos.push({
        videoId,
        title: snip.title ?? "",
        description: snip.description ?? "",
        publishedAt: snip.publishedAt ?? snip.videoOwnerChannelTitle ?? null,
        // videoPublishedAt is the date the underlying video was uploaded
        // (vs. snip.publishedAt which is when it was added to the playlist).
        videoPublishedAt:
          item.contentDetails?.videoPublishedAt ?? snip.publishedAt ?? null,
        channelTitle: snip.videoOwnerChannelTitle ?? "",
        thumbnail: pickThumb(snip.thumbnails),
        position: snip.position ?? 0,
        url: `https://www.youtube.com/watch?v=${videoId}&list=${PLAYLIST_ID}`,
      });
    }
    pageToken = data.nextPageToken ?? null;
  } while (pageToken);

  // Newest videos first by upload date.
  videos.sort((a, b) => {
    const at = a.videoPublishedAt ?? "";
    const bt = b.videoPublishedAt ?? "";
    return bt.localeCompare(at);
  });

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        playlistId: PLAYLIST_ID,
        videos,
      },
      null,
      2
    )
  );
  console.log(`[youtube] Wrote ${videos.length} videos → ${outPath}`);
} catch (err) {
  console.error("[youtube] Fetch failed:", err.message);
  writeEmpty("Fetch failed");
}
