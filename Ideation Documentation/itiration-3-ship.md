# Cursor Prompt — Iteration 3: Ship, Verify, and Document

Take the working document editor from iterations 1 and 2 to a reviewable submission. Do not introduce new scope until the existing golden path is reliable.

## Product goal
A reviewer should be able to open a live URL, understand the product quickly, log in with provided accounts, create or import a document, share it, edit it as another user, and trust that the data is saved. The product should feel intentional and the submission should make tradeoffs easy to evaluate.

## First priority: reliability
Audit every data and interaction path for:
- Loading states.
- Empty states.
- Visible error states.
- Disabled actions during requests.
- Safe handling of failed saves, imports, lookups, shares, and deletes.
- No console errors.
- No silent data loss.

Add boundary validation:
- Document title cannot be blank.
- Imported files must be `.txt` or `.md` and no larger than 1 MB.
- Share email must have a valid basic format.
- Duplicate shares, self-sharing, and invalid roles must be rejected clearly.

## UX polish
- Add a consistent top bar showing the current user's email and logout.
- Improve responsive behavior for mobile widths.
- Ensure the formatting toolbar wraps without breaking the editor.
- Add restrained hover, focus, modal, and disabled-button states.
- Keep text readable with strong contrast and a neutral professional visual system.
- Keep view, edit, and share actions clear rather than stacking unrelated workflows on one screen.

## Automated verification
Use the test tooling already present in the project, or add Vitest if no test runner exists.
- Add at least one meaningful test for the Markdown-to-TipTap converter.
- Assert headings, paragraphs, bullet lists, blank-line handling, and ordinary text.
- Add a second focused test for a high-risk behavior if it is inexpensive.
- Do not write a superficial test that only checks a constant or renders without asserting behavior.

## Deployment
Deploy the application using the project's supported deployment path.
- Set the public client configuration needed by the deployed build.
- Confirm the live URL loads.
- Confirm authentication works.
- Confirm document creation and persistence works.
- Confirm Alice-to-Bob sharing and editing works on the live URL.
- If deployment is blocked, document the exact blocker honestly rather than marking it complete.

## Documentation deliverables
Create or update these files in the repository root:

### README.md
Include:
- Product summary.
- Live URL.
- Local setup.
- Required environment variables by name, without exposing secrets.
- Reviewer credentials or exact reviewer setup.
- Main user flows.
- Supported file types.
- Known limitations.

### ARCHITECTURE.md
Write 300–500 words covering:
- Why the editor spine was built first.
- How TipTap JSON is persisted.
- The documents and collaborator data model.
- How RLS enforces ownership and roles.
- Why file import is limited to `.txt` and `.md`.
- Explicit scope cuts and their rationale.

### AI_WORKFLOW.md
Explain:
- Which AI tools were used.
- Where they accelerated delivery.
- Which generated suggestions were changed or rejected.
- How correctness, security, and UX were verified.

### SUBMISSION.md
List:
- Exactly what is included.
- What works end to end.
- What is partial or incomplete.
- What would be built next with another 2–4 hours.
- Any live testing notes.

### WALKTHROUGH_URL.txt
Add the walkthrough video URL once recorded. If it is not recorded yet, write a clear placeholder and mark it incomplete in SUBMISSION.md.

## Optional stretch: only after the core is green
Implement only one stretch feature: document version history.
- Store prior TipTap JSON snapshots.
- Let an owner view available versions.
- Let an owner restore a selected version.
- Protect version data with RLS.
- If this threatens the core flow or deployment, defer it and document it instead.

## Final golden-path review
Run through:
1. Alice logs in.
2. Alice creates and formats a document.
3. Alice imports Markdown.
4. Alice shares as editor.
5. Bob logs in and edits.
6. Alice sees the persisted change.
7. Viewer access is read-only.
8. Refreshes preserve content and formatting.
9. Logout works.
10. Live deployment works, or the blocker is documented.

Finish by reporting the live URL, reviewer access method, what works, and what remains on the future roadmap. Never describe an unverified feature as complete.
