# TPCH Docs

Documentation site for TPCH load domains and table definitions, built with Next.js, TypeScript, and shadcn UI.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set the path to your TPCH project in `.env.local` (required):

```
TPCH_BASE_PATH=C:\Users\User\starlake-projects\tpch
```

The app reads only from `TPCH_BASE_PATH`; there is no default. It expects a `tables` folder (with `domains.json` and `{domain}.{table}.json`) and a `tasks` folder (with `tasks.json` and `{domain}.{task}.json`).

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the sidebar **Load** section to browse domains and tables.

## Features

- **Dark / light mode** – Toggle in the navbar.
- **Responsive layout** – Sidebar is collapsible on small screens (hamburger menu).
- **Load section** – Lists domains from `tables/domains.json` and tables from `tables/{domain}.{table}.json`.
- **Routes** – `/load` (overview), `/load/[domain]` (domain tables), `/load/[domain]/[table]` (table schema/metadata).

## Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn UI
- next-themes (dark mode)
