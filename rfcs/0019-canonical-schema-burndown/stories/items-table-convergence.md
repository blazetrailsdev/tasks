---
title: "Converge bespoke items scratch tables to file-unique names"
status: done
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
---

> **CLOSED 2026-06-25 — approach rejected.** This story prescribed renaming column-incompatible `items` definitions to file-unique names (`<prefix>_items`) while keeping `defineSchema`. That entrenches the divergent path and invents non-canonical tables (`items` IS a canonical schema.rb table, used via `fixtures :items`) — counter to fidelity-first and the `*-test-canonical` stories, which DELETE `defineSchema` and ride canonical `TEST_SCHEMA` + fixtures. The `items` collision is properly resolved by those per-file canonical conversions plus RFC 0043 (deleting bespoke no-Rails tests). PR #4168 (the rename PR) is closed unmerged.

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
