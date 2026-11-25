# IdeaMatch

IdeaMatch is a Next.js app that takes a natural-language idea and matches it against GitHub repositories, ranking results by relevance and signaling viability.

## Features

- Natural-language idea input
- GitHub repository search (authenticated for higher rate limits)
- AI-assisted analysis via Gemini (optional)
- Keyword fallback when no Gemini key is provided
- Ranking and scoring of candidate repos

## Getting Started

```bash
npm install
cp .env.example .env.local
# fill in GEMINI_API_KEY / GITHUB_TOKEN (optional)
npm run dev
```

Open http://localhost:3000

## Environment Variables

See `.env.example`.

- `GEMINI_API_KEY` — optional, enables AI analysis
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`
- `GITHUB_TOKEN` — recommended, raises GitHub search rate limit

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check

## Deploy

Deployed on Vercel.
