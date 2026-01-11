# Agent Skills Website

The official website and documentation for [Agent Skills CLI](https://github.com/Karanjot786/agent-skills-cli) - the universal skill manager for AI coding agents.

🌐 **Live:** [https://agentskills.in](https://agentskills.in)

## Features

- 📦 **Skill Marketplace** - Browse 50,000+ skills with search, filters, and categories
- 📖 **Documentation** - Complete CLI reference with interactive examples
- 🔍 **Global Search** - Find skills and docs instantly with `⌘K`
- 🎨 **Modern UI** - Dark theme with glassmorphism and micro-animations
- 🤖 **AI-Optimized** - SEO + GEO (Generative Engine Optimization) with `llms.txt`

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Components:** shadcn/ui + Radix UI
- **Icons:** Lucide React
- **Animations:** Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
website/
├── public/
│   ├── robots.txt      # Crawler control
│   ├── llms.txt        # AI content manifest
│   └── manifest.json   # PWA config
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── docs/page.tsx      # Documentation
│   │   ├── marketplace/       # Skills browser
│   │   └── api/               # API routes
│   └── components/            # Reusable UI
└── package.json
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |

## SEO & GEO

This website is optimized for both search engines and AI:

- `robots.txt` - Allows GPTBot, Claude, Perplexity crawlers
- `llms.txt` - AI content manifest for LLM understanding
- `sitemap.xml` - Dynamic sitemap with 50k+ skill pages
- JSON-LD structured data

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT © [Karanjot Singh](https://github.com/Karanjot786)


