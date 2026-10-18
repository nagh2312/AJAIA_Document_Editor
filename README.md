# Ajaia Docs

Internal document editor for Ajaia LLC. Create a document, edit it with TipTap, autosave, import `.txt` / `.md` / `.docx`, and share it with another account as an editor or a viewer.

## Run locally

Requirements: Node.js 22.

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open http://localhost:3000.

`npm run db:setup` runs the migrate and seed steps after `.env` exists.

## Tests

```bash
npm test
```

That runs Vitest. `tests/access.test.ts` fails if a viewer can change a document or if someone without access can read it.

## Seeded logins

Both passwords are `demo123`. They are also shown on the login screen.

| Name | Email | Role in the demo |
| --- | --- | --- |
| Nagashree | nagashree@ajaia.local | Document owner |
| Alex | alex@ajaia.local | Collaborator |

## Supported import types

`.txt`, `.md`, and `.docx`. Anything else is rejected in the UI and by the API. Plain text becomes paragraphs. Markdown becomes paragraphs, H1–H3, and simple bullet or numbered lists, with `**bold**` and `*italic*`. `.docx` is converted with Mammoth. This is not a Markdown IDE.

## Demo sharing

1. Sign in as Nagashree and create a document.
2. Open Share, enter `alex@ajaia.local`, choose Viewer, and add them.
3. Sign out and sign in as Alex. The document is under Shared with me and the editor is view-only.
4. Sign back in as Nagashree. The document is still under Owned by me.

Editors can change the title and body. Only the owner can delete the document or change who has access. A new share defaults to Editor.

## Docker

Docker is not installed in the environment that produced this repo, so this image was not built here. On a machine with Docker:

```bash
docker compose up --build
```

The app listens on http://localhost:3000. SQLite is stored on the `ajaia-data` volume at `/data/dev.db`. The container runs migrations and the seed on startup.

## Public URL

A Cloudflare quick tunnel was started in front of `next start` while this environment was running:

https://instance-affair-api-you.trycloudflare.com

That URL is not durable. It stops when the tunnel process or this machine stops. If it does not load, use local `npm run dev` or Docker. To start a tunnel yourself after the app is on port 3000:

```bash
cloudflared tunnel --url http://localhost:3000 --no-autoupdate
```
