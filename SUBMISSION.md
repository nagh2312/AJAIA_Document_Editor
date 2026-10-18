# Submission

## Included

- Next.js app at the repo root (`package.json`, `app/`, `prisma/`)
- Email/password sessions, two seeded users, TipTap editor, autosave, document list split, import, owner/editor/viewer sharing
- Vitest access-control test
- `Dockerfile` and `docker-compose.yml`
- `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, this file, `WALKTHROUGH_URL.txt`

## Live URL

https://instance-affair-api-you.trycloudflare.com

Checked once from this environment: `GET /login` returned 200 and the HTML included the seeded emails. It is a Cloudflare quick tunnel in front of `next start` on this machine, with SQLite in `prisma/dev.db`. It is not a stable host. When this environment stops, the URL stops. There is no paid platform account here.

If the URL does not load, the review path is local or Docker:

```bash
npm install && cp .env.example .env && npx prisma migrate deploy && npx prisma db seed && npm run dev
```

```bash
docker compose up --build
```

Docker was not installed in the environment that built this repo, so that compose command was not executed here.

## Credentials

- nagashree@ajaia.local / demo123 — Nagashree, use as the owner
- alex@ajaia.local / demo123 — Alex, collaborator

## What works

- Create, rename, rich text (bold, italic, underline, H1–H3, bullets, numbers), debounced autosave, refresh keeps TipTap JSON
- Owned by me / Shared with me, including empty states
- Import `.txt`, `.md`, `.docx`; other types show an error. Supported types are on the documents page and in the README
- Owner shares by email. Viewer can open and cannot edit. Non-owner cannot delete or re-share. A user with no access gets an error and not the document
- SQLite file survives refresh. Restart the server and the file is still there
- Validation: empty title, unknown email, share with self, unsupported file, signed-out redirect, forbidden document
- `npm test` covers the sharing gate

## Incomplete

- No realtime collaboration, cursors, comments, suggestions, version history, PDF export, offline, or enterprise ACL
- Two people editing the same document can overwrite each other
- Markdown import is a small subset
- The public URL is a temporary tunnel
- Docker Compose was not run in this environment

## Next 2–4 hours

Save a short revision list on each successful save and let the owner restore one. If time remains, refuse a save when `updatedAt` moved under the editor. Leave cursors, comments, suggestion mode, PDF, offline, and enterprise ACL for later.
