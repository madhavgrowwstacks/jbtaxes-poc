# JB Taxes — Operations Prototype

A clickable, interactive prototype of the JB Taxes operations platform. **Sample data only** — nothing connects to ProConnect, Intuit, Stripe, Twilio or any live system.

## Screens
| Route | What it shows |
| --- | --- |
| `/` | Firm dashboard — KPI cards with trends, season progress, returns by status, live activity feed, and the client table (search, quick filters, sortable columns, inline status/assignee editing, reminders, pagination, CSV export) |
| `/clients` | Full client list (same table, larger pages) |
| `/client/[id]` | Client detail — editable profile, AI document checklist (click a status to cycle it), communication log with a working composer, "Send reminder now" |
| `/chase` | Morning chase queue — mark calls done, resolve or ask about AI document flags, overnight auto-nudge results |
| `/intake` | Client-facing intake in a phone frame — returning vs new client, editable pre-filled fields, branching Yes/No questions, simulated uploads, mock Stripe deposit with success receipt |
| `/review/[id]` | AI review summary — edit, regenerate, human sign-off checklist, send to client, print to PDF |
| `/reminders` | Segmented reminder rules by return type — toggle, edit deadline/channel/cadence, add and delete rules |
| `/settings` | Firm profile, team workload, notification toggles, mocked integrations, reset sample data |

## Tax year selector
The **Tax year** dropdown in the top bar switches seasons. 2025 is the live season (everything editable). 2024 and 2023 are closed, read-only archives: the dashboard becomes a season review (filed totals, extensions, returns by type, highlights), clients show as filed with their filed date, and clients who joined later are hidden. The Chase Queue, Intake and AI Reviews only run for the live season. Season figures live in `SEASONS` in `lib/data.js`.

## How state works
All edits live in React state and are saved to the browser's `localStorage` (key `jbtaxes-demo-v1`), so they survive a refresh but are private to that browser. Use **Settings → Reset** (or the avatar menu) to restore the original sample data.

## Project layout
- `lib/data.js` — all sample data (28 clients, checklists, chats, reminder rules, AI summaries). Assignee names are the firm's real preparers.
- `lib/utils.js` — formatting and derived metrics.
- `components/store.js` — app state, actions and persistence.
- `components/AppLayout.js` — sidebar, top bar (search, notifications, user menu), mobile drawer.
- `components/ui/` — Button, Card, Badge, Modal, Toast, Dropdown (Select / Menu / Popover), Switch, Segmented, Table, etc.

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000

Don't run `npm run build` while `npm run dev` is running — both write to `.next` and can corrupt it. If you ever see `Cannot read properties of undefined (reading 'call')`, stop the dev server, delete `.next`, and start it again.

## Deploy to Vercel
Push this folder to a GitHub repo, then in Vercel → New Project → import the repo → Deploy. No environment variables or configuration needed.
