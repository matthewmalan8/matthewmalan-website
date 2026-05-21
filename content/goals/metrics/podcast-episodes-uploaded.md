---
name: Podcast episodes uploaded
unit: episodes
---
Auto-computed from `content/episodes/*.md`. Every episode in /admin/ counts once, using the episode's publish date.

Spotify / Apple / YouTube don't have a free public API for "list my episodes" — but since the site already has every episode as markdown in /admin/, that's the source of truth anyway. The moment you publish a new one in /admin/, the next build picks it up.
