# Cursor Prompt — Iteration 1: Foundation / Editor Spine

Build the foundation of a lightweight collaborative document editor inspired by Google Docs. This is iteration 1 of 3. The goal is a fully working single-user document editor with persistence; do not add sharing or file import yet.

## Product goal
A reviewer must be able to log in, create a document, edit rich text, rename it, leave it, reopen it, refresh the browser, and see the document and formatting preserved. This proves the core product loop before adding collaboration.

## Stack and constraints
- Use Vite, React, TypeScript, Tailwind CSS, Supabase, and TipTap.
- Use Supabase for authentication and persistence.
- Use TipTap JSON for document content; do not store only rendered HTML.
- Use a neutral, professional palette. Do not use purple or indigo.
- Follow an 8px spacing system and make the layout responsive.
- Match the existing project conventions before adding new abstractions.
- Do not use the Supabase CLI. Use the project's database migration workflow.

## Authentication
- Add Supabase email/password login and sign-up.
- Keep email confirmation off for this assignment.
- Add a session-aware route: unauthenticated users see login; authenticated users see the dashboard.
- Show clear loading and error states.
- Provide two seeded reviewer accounts, Alice and Bob, if the project setup supports it. If database-level user seeding is not safely possible through the available workflow, document the exact reviewer setup rather than pretending accounts exist.

## Persistence
Create a `documents` table with:
- `id` uuid primary key
- `user_id` uuid referencing `auth.users`
- `title` text, default `Untitled`
- `content` jsonb
- `created_at` and `updated_at` timestamps

Enable RLS and create separate SELECT, INSERT, UPDATE, and DELETE policies. For this iteration, users can access only documents they own, using `auth.uid()` ownership checks.

## Dashboard
- Show a `Your documents` section.
- Add `New document`.
- Show title and last-updated time.
- Support opening, renaming, and deleting documents.
- Confirm before delete.
- Include a useful empty state.

## Editor
- Add editable document title.
- Add TipTap rich text editing.
- Support bold, italic, underline, H1, H2, bulleted lists, and numbered lists.
- Add a visible toolbar with active formatting states.
- Autosave content with a debounce of about 800ms.
- Save the title on blur or Enter.
- Show `Saving…`, `Saved`, and visible error states.
- Load and hydrate the editor from stored TipTap JSON.
- Ensure formatting survives a full browser refresh.

## Quality gate
Before finishing, verify this exact path:
1. Log in.
2. Create a document.
3. Add paragraphs, a heading, bold text, and a list.
4. Rename the document.
5. Return to the dashboard.
6. Reopen the document.
7. Refresh the browser.
8. Confirm title, content, and formatting remain intact.

Update README with setup, required environment variables, the user flow, and explicit scope cuts. Do not implement sharing, file import, version history, real-time collaboration, or deployment in this iteration.

At the end, report what works, what was intentionally deferred, and any issue that requires a decision before iteration 2.
