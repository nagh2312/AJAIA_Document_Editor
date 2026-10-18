# Architecture

Ajaia Docs is a single Next.js App Router app with a SQLite file. The priority was a short path that a reviewer can run and a sharing rule that is actually enforced on the server.

## What was prioritized

- One owner per document, with Editor and Viewer shares.
- TipTap JSON in the database so bold, italic, underline, headings, and lists survive a refresh.
- Debounced autosave with a visible Saved / Saving / Error state.
- Import for `.txt`, `.md`, and `.docx` only.
- An automated test that calls the real route handlers for read and write access.

Realtime collaboration, cursors, comments, suggestion mode, version history, PDF export, offline editing, and an enterprise ACL were left out on purpose.

## Data model

SQLite via Prisma (`prisma/schema.prisma`, migration in `prisma/migrations`).

- `User` — email, name, bcrypt password hash.
- `Session` — SHA-256 hash of a random token, expiry. The raw token is only in the `ajaia_session` httpOnly cookie.
- `Document` — title, TipTap JSON string, `ownerId`.
- `Share` — one row per `(document, user)` with role `editor` or `viewer`.

The cookie is not marked `Secure` unless `COOKIE_SECURE=true`, so login works on http://localhost and inside Docker.

## Auth

`POST /api/auth/login` checks the password and sets the cookie. Middleware only looks for the cookie and sends anonymous page views to `/login`. Every API route and server page loads the session from SQLite, so a stale cookie is not treated as a user. There is no OAuth and no account signup. The two seeded users are the directory.

## Sharing rules

`lib/access.ts` is the gate. Routes do not query documents and then decide.

- Missing document: 404.
- No share and not the owner: 403, and the response does not include the body.
- Viewer: may read, may not rename, edit, delete, or share.
- Editor: may rename and edit, may not delete or share.
- Owner: may do all of that.
- Sharing with yourself, or with an email that is not a user, is a 400.
- A new share defaults to Editor. An unknown role string on a share row grants viewer, not owner.

The document page uses the same helpers. A forbidden user sees the error text, not the TipTap document.

## Editor and import

The toolbar is TipTap StarterKit with headings limited to H1–H3. Underline comes from StarterKit. The client stores `editor.getJSON()` and PATCHes it after 700ms. The title saves on its own debounce. Empty titles are rejected in the browser and again on the server.

`.txt` is one paragraph per non-empty line, with no Markdown interpretation. `.md` handles H1–H3, `-` / `*` lists, `1.` lists, `**bold**` / `__bold__`, and `*italic*`. `.docx` goes through Mammoth HTML and then TipTap's server HTML parser, using the same extensions as the editor. Images in a Word file are dropped.

## What is incomplete

- No conflict handling if two editors save over each other. Last write wins.
- Markdown import is a small block parser, not CommonMark.
- No password reset, signup, or session list.
- The Cloudflare URL in the README is a quick tunnel, not hosted infrastructure.
- Docker Compose is the portable run path. This environment did not have Docker, so the image was not built here.

## Next 2–4 hours

I would not start cursors or a sync protocol. The next slice that fits this model is snapshot history: write a `DocumentRevision` row on each successful save, list the last few on the document, and restore one. That is a few tables and one UI panel.

After that, in the same window if it is still open: a "someone else saved" check using `updatedAt` so the second editor does not silently overwrite.

Still later, and not in that 2–4 hours: realtime collaboration, live cursors, comments, suggestion mode, PDF export, offline editing, and anything like an enterprise ACL.
