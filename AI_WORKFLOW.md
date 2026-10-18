# How this was built

A Cursor coding agent (Grok) wrote this app from the hiring assignment. I did not hand-write the product in an editor and then ask a model to polish it. The assignment specified the stack, the two accounts, the editor marks, import types, sharing roles, the test that must fail if access control breaks, and these write-ups. The agent generated the Next.js app, Prisma schema, seed, TipTap UI, routes, Vitest tests, Docker files, and these documents.

## What was specified vs generated

Specified and kept: Next.js App Router, TypeScript, Tailwind, TipTap, Prisma, SQLite at `prisma/dev.db`, email/password with an httpOnly cookie, exactly the two seeded users, Owner / Editor / Viewer, default share role Editor, autosave with Saved / Saving / Error, and the access-control test.

Generated and then checked: the schema, the access helpers, the page layout, the Markdown subset, the Mammoth path, and the test that hits the route handlers with a mocked cookie.

## What was rejected or simplified

- The repo had another branch with a Vite + Supabase single-user editor. This work did not use it. `main` was empty, and the assignment locks the stack to Next.js, Prisma, and SQLite.
- No OAuth, no hosted database, no realtime, no cursors, no comments, no suggestion mode, no version history, no PDF, no offline mode.
- Markdown import does not try to be a Markdown IDE. Single-underscore italics were skipped so names like `file_name` stay literal. Underline is an editor mark, not something the Markdown importer invents.
- A first GUI pass did not complete file import because the operating-system file dialog never attached a file (the server log showed no import request, and the control still said "No file chosen"). The import API and a later headless Chrome run with the file set on the input both succeeded. I did not treat the missed file dialog as a product bug.

## How it was verified

- `npm test` — Vitest, 4 tests passed, including `tests/access.test.ts` (viewer PATCH stays 403 and the stored secret is unchanged; a non-member GET is 403 and the body does not contain the document text; an editor can rename but cannot delete or re-share).
- `npm run build` completed.
- curl against the running app: login, create, save TipTap JSON, import `.txt`, reject `.pdf`, share Alex as viewer, Alex's list, Alex's PATCH 403, empty title 400, share-with-self 400.
- A Mammoth smoke conversion of a small `.docx` produced bold and italic nodes.
- Browser, signed in as Nagashree: create "Hiring notes", apply bold, italic, underline, H1, and a bullet list, refresh, formatting still there. Share dialog set Alex to Viewer. Signed in as Alex: the document is under Shared with me, the badge says Viewer, and typing did not change the text. Signed back in as Nagashree: the document is still owned.
- Headless Chrome (Playwright, system Chrome) set `/tmp/ajaia-import.md` on the file input. The app created a document whose heading and bullet list came from that file.
- A Cloudflare quick tunnel returned the login page over HTTPS. Docker is not installed here, so `docker compose up` was not run.

I did not publish a Loom or YouTube video. The screen recording is the local file named in `WALKTHROUGH_URL.txt` (about 3 minutes 40 seconds, with on-screen captions). There is no paid deploy URL.
