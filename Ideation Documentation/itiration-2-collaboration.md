# Cursor Prompt — Iteration 2: File Import and Collaboration

Continue the collaborative document editor from iteration 1. Do not rewrite the working editor foundation or regress login, document persistence, rich-text formatting, autosave, rename, open, or delete behavior.

## Product goal
Make the assignment's most important multi-user workflow work end to end: Alice imports or creates a document, shares it with Bob, Bob finds it under `Shared with you`, and Bob can edit it when granted editor access. Access must be enforced in the database as well as represented in the interface.

## File import
- Add an `Import file` action on the dashboard.
- Support `.txt` and `.md` only in this iteration.
- Clearly display supported file types near the action.
- Import creates a new editable document.
- Derive the title from the filename without the extension.
- Convert common Markdown safely and predictably:
  - `#` becomes H1.
  - `##` becomes H2.
  - Lines beginning with `-` or `*` become bullet-list items.
  - Blank lines separate paragraphs.
  - Other lines become paragraphs.
- Keep the converter as a pure, separately testable function.
- Show visible errors for unsupported types and files larger than 1 MB.
- Disable the action while processing.
- Do not claim to support `.docx`.

## Sharing data model
Add `document_collaborators` with:
- `id` uuid primary key
- `document_id` referencing `documents` with cascade delete
- `user_id` referencing `auth.users`
- `role` limited to `viewer` or `editor`, default `editor`
- `created_at`
- unique constraint on document and user

Enable RLS and create separate SELECT, INSERT, UPDATE, and DELETE policies. Owners manage collaborator rows. Collaborators can read their own membership. Do not use `FOR ALL`.

Update document access rules:
- Owner can read, edit, and delete their document.
- Collaborator can read a document.
- Collaborator with role `editor` can edit.
- Collaborator cannot delete the document.
- Collaborator cannot manage sharing.
- Use `auth.uid()` and database checks; do not rely only on hidden buttons or client-side role state.

## User lookup and sharing UI
- Provide a reliable way to look up a registered user by email.
- Prefer a safe public profiles lookup containing only user id and email, or another server-enforced approach appropriate to the existing project.
- Do not expose private auth internals unnecessarily.
- Add a `Share` action visible to the owner.
- Open a focused modal with email, role selector, share action, validation, loading, success, and error states.
- List current collaborators with role.
- Allow the owner to remove a collaborator.
- Prevent sharing with the owner and duplicate memberships.

## Dashboard and editor behavior
- Split the dashboard into `Your documents` and `Shared with you`.
- Show the owner email on shared documents.
- Viewer mode must be read-only: disable editing and editing controls.
- Editor mode must allow editing and autosave.
- Make ownership and role visible without overwhelming the screen.

## Quality gate
Verify this exact scenario:
1. Log in as Alice.
2. Import a Markdown file containing a heading, paragraphs, and bullets.
3. Confirm the imported document is editable and correctly formatted.
4. Share it with Bob as `editor`.
5. Log in as Bob.
6. Confirm the document appears under `Shared with you`.
7. Edit it and refresh.
8. Log in as Alice and confirm Bob's change persisted.
9. Remove Bob's access.
10. Confirm Bob can no longer access the document.
11. Repeat with viewer access and confirm viewer editing is blocked.

Update README with the sharing model, roles, supported file types, test flow, and known limitations. Defer `.docx`, real-time cursors, comments, public links, granular permissions, and audit history to the future roadmap.

At the end, report the working Alice-to-Bob path, database access rules, known limitations, and what iteration 3 must verify.
