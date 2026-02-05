# Website Analyzer & Marketing Strategy Tool

A Next.js application that uses Firecrawl.dev to scrape client websites, then leverages OpenAI GPT-4 to analyze marketing strategy, tech stack, architecture, and provide actionable recommendations.

## Features

- **Website Scraping Dashboard** - Input client URLs and view scraping progress
- **AI-Powered Analysis Modules**:
  - Marketing Analysis (SEO, CTAs, messaging, value propositions)
  - Tech Stack Detection (frameworks, CMS, analytics, third-party tools)
  - Architecture Overview (site structure, navigation, page hierarchy)
  - Performance Indicators (page speed insights, mobile responsiveness)
  - Improvement Recommendations (prioritized action items)
- **Client Reports** - Generate shareable markdown reports

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: SQLite with Drizzle ORM
- **AI**: OpenAI GPT-4
- **Scraping**: Firecrawl.dev API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firecrawl API key (from https://firecrawl.dev)
- OpenAI API key (from https://platform.openai.com)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the example environment file and add your API keys:

```bash
cp .env.example .env.local
```

3. Edit `.env.local` with your API keys:

```env
FIRECRAWL_API_KEY=your_firecrawl_key
OPENAI_API_KEY=your_openai_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Create a Project** - Click "New Project" and enter the website URL you want to analyze
2. **Scrape the Website** - Click "Start Scraping" to crawl up to 10 pages from the site
3. **Run AI Analysis** - Once scraping is complete, click "Run AI Analysis" to generate insights
4. **View Results** - Explore the analysis tabs for marketing, tech stack, architecture, and performance insights
5. **Export Report** - Generate a markdown report to share with clients or team members

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Dashboard home
│   ├── projects/
│   │   ├── page.tsx         # Project list
│   │   ├── new/page.tsx     # New project form
│   │   └── [id]/
│   │       ├── page.tsx     # Project detail
│   │       ├── analysis/    # AI analysis view
│   │       └── report/      # Generated report
│   └── api/
│       ├── projects/        # Projects CRUD
│       ├── scrape/          # Firecrawl integration
│       └── analyze/         # OpenAI analysis
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── db/                  # Drizzle ORM setup
│   ├── firecrawl.ts         # Firecrawl API client
│   ├── openai.ts            # OpenAI client & prompts
│   └── utils.ts
└── types/
    └── index.ts             # TypeScript definitions
```

## Database Schema

- **projects** - Website analysis projects
- **pages** - Scraped page content
- **analyses** - AI analysis results by type

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema changes to database

## License

MIT
