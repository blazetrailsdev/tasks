---
title: "Converge bespoke posts scratch tables to file-unique names"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 28
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

**Enabling convergence story** (RFC §"Collision-table convergence"). The
`posts` scratch table is redefined with divergent column sets across many test
files under parallel forks — the direct cause of the documented shared-DB flake
(memory `posts_table_shared_db_flake` where applicable). This story removes the
collision so the per-file port stories that consume `posts` can convert safely.

The rule (RFC): for every inline `posts` definition across the suite —

- **column-compatible** with the canonical `posts` shape → convert it to
  ride `TEST_SCHEMA.posts` + the canonical model;
- **column-incompatible** (a divergent scratch shape) → **rename it file-unique**
  (e.g. `<prefix>_posts`) so it can never clobber the shared table. Renaming a
  table is allowed; renaming a test is not.

This is a wide, shallow sweep across many files — NOT a fidelity port. The
per-file fidelity ports are owned by their own stories; this just de-collides.

## Acceptance criteria

- [ ] Inventory every inline `posts` definition in the AR suite (`grep` for
      `posts:` in `defineSchema` literals).
- [ ] Each occurrence either rides canonical `TEST_SCHEMA.posts` (column-compatible)
      or is renamed to a file-unique name (column-incompatible). No two files
      define `posts` with divergent shapes any more.
- [ ] Verify by co-running the previously-flaky `posts` siblings under
      `maxForks=1` (never the whole suite) — the collision is gone.
- [ ] `pnpm lint` clean on touched files; no new `eslint-disable`.

## Notes

- This may touch many files but each change is small; keep the PR under 500 LOC
  by batching by directory and registering follow-up waves as new stories rather
  than fanning out sibling PRs yourself.
- Does NOT remove files from the exclude JSON by itself — it unblocks the port
  stories that do.

## Definition of done

No file defines `posts` with a shape that diverges from the canonical
`posts`; incompatible scratch shapes are file-unique. The flaky siblings
pass under `maxForks=1`.
