import fs from "fs";
import path from "path";

export type Speech = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string | null;
  videoPublishedAt: string | null;
  channelTitle: string;
  thumbnail: string | null;
  position: number;
  url: string;
};

export type SpeechCache = {
  generatedAt: string;
  playlistId?: string;
  videos: Speech[];
};

const cachePath = path.join(
  process.cwd(),
  "content",
  "speaking",
  "cache",
  "speeches.json"
);

export function getSpeeches(): SpeechCache {
  if (!fs.existsSync(cachePath)) {
    return { generatedAt: "", videos: [] };
  }
  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    const parsed = JSON.parse(raw) as SpeechCache;
    return {
      generatedAt: parsed.generatedAt ?? "",
      playlistId: parsed.playlistId,
      videos: parsed.videos ?? [],
    };
  } catch {
    return { generatedAt: "", videos: [] };
  }
}
