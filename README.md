# Clariose

Clariose is a collaborative thinking workspace for turning rough ideas into clear, useful work. Create a board, sketch with an interactive whiteboard, organize supporting documents, and share the result with others.

The app is built with Next.js and combines a visual Excalidraw canvas with authenticated workspaces, persistent board storage, and AI-assisted diagram generation.

## Features

- **Visual whiteboards** powered by [Excalidraw](https://excalidraw.com/)
- **Authenticated workspaces** with [Clerk](https://clerk.com/)
- **Persistent boards** stored in Neon Postgres through [Drizzle ORM](https://orm.drizzle.team/)
- **Board management** including creation, archiving, and dashboard browsing
- **Board sharing** with viewer permissions and share links
- **Workspace documents** for notes and supporting project context
- **AI-assisted diagrams** for turning a prompt into a reviewable board proposal
- **Light and dark themes** with a responsive interface

## Tech Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Clerk authentication
- Excalidraw
- Drizzle ORM and Neon Postgres
- Gemini or OpenRouter for AI diagram generation

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm
- A Clerk application
- A Neon Postgres database
- An AI provider key if you want to use AI diagram features

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/AvatarN03/whiteboard.git
cd whiteboard
pnpm install
```

Create a `.env.local` file in the project root:

```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=your_neon_database_url

# AI (choose the provider you want to use)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
# OPENROUTER_API_KEY=your_openrouter_api_key
# OPENROUTER_MODEL=openrouter/free
```

Apply the database schema, then start the development server:

```bash
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Sign up or sign in to access the dashboard and create a board.

## Common Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate a Drizzle migration |
| `pnpm db:push` | Push the schema to the configured database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm ai:verify` | Run AI workflow verification |
| `pnpm ai:verify-phase6` | Run the additional AI verification checks |

## Project Structure

```text
app/                 Next.js routes, pages, and API endpoints
components/custom/   Application-specific UI components
components/ui/       Reusable UI primitives
db/                  Drizzle schema and database connection
lib/                 Shared utilities, board queries, documents, and AI logic
drizzle/             Database migrations
docs/                Architecture and implementation notes
scripts/              Verification scripts
```

## How It Works

1. Clerk authenticates the user and protects workspace operations.
2. The dashboard loads the user’s boards and provides access to archived boards and settings.
3. Each workspace combines an Excalidraw whiteboard with project documents.
4. Board snapshots and documents are persisted in Postgres.
5. AI requests are handled server-side, validated, and returned as diagram proposals. The user reviews a proposal before it is added to the board.

## Deployment

The app can be deployed to [Vercel](https://vercel.com/) or another platform that supports Next.js. Configure the production Clerk keys, `DATABASE_URL`, and any AI provider variables in the deployment environment before building.

For production builds:

```bash
pnpm build
pnpm start
```

## Additional Documentation

- [AI canvas implementation plan](./docs/AI-CANVAS-IMPLEMENTATION-PLAN.md)
- [Next.js documentation](https://nextjs.org/docs)
- [Clerk documentation](https://clerk.com/docs)
- [Drizzle documentation](https://orm.drizzle.team/docs/overview)
- [Excalidraw documentation](https://docs.excalidraw.com/)
