---
title: "Converge bespoke items scratch tables to file-unique names"
status: in-progress
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 25
pr: 4168
claim: "2026-06-26T01:06:58Z"
assignee: "items-table-convergence"
blocked-by: null
---

## Context

**Enabling convergence story** (RFC §"Collision-table convergence"). The
`items` scratch table is redefined with divergent column sets across many test
files under parallel forks — the direct cause of the documented shared-DB flake
(memory `items_table_shared_db_flake` where applicable). This story removes the
collision so the per-file port stories that consume `items` can convert safely.

The rule (RFC): for every inline `items` definition across the suite —

- **column-compatible** with the canonical `items` shape → convert it to
  ride `TEST_SCHEMA.items` + the canonical model;
- **column-incompatible** (a divergent scratch shape) → **rename it file-unique**
  (e.g. `<prefix>_items`) so it can never clobber the shared table. Renaming a
  table is allowed; renaming a test is not.

This is a wide, shallow sweep across many files — NOT a fidelity port. The
per-file fidelity ports are owned by their own stories; this just de-collides.

## Acceptance criteria

- [ ] Inventory every inline `items` definition in the AR suite (`grep` for
      `items:` in `defineSchema` literals).
- [ ] Each occurrence either rides canonical `TEST_SCHEMA.items` (column-compatible)
      or is renamed to a file-unique name (column-incompatible). No two files
      define `items` with divergent shapes any more.
- [ ] Verify by co-running the previously-flaky `items` siblings under
      `maxForks=1` (never the whole suite) — the collision is gone.
- [ ] `pnpm lint` clean on touched files; no new `eslint-disable`.

## Notes

- This may touch many files but each change is small; keep the PR under 500 LOC
  by batching by directory and registering follow-up waves as new stories rather
  than fanning out sibling PRs yourself.
- Does NOT remove files from the exclude JSON by itself — it unblocks the port
  stories that do.

## Definition of done

No file defines `items` with a shape that diverges from the canonical
`items`; incompatible scratch shapes are file-unique. The flaky siblings
pass under `maxForks=1`.
