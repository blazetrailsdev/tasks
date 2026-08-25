---
title: "Converge bespoke HABTM-join scratch tables to file-unique names"
status: done
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
---

> **CLOSED 2026-06-25 — approach rejected.** Same flawed premise: rename bespoke HABTM join tables file-unique + keep `defineSchema`. The fidelity fix is to ride the canonical join tables (delete `defineSchema`) in the per-file conversions, or delete bespoke no-Rails tests (RFC 0043) — not invent file-unique join names.

## Context

**Enabling convergence story** (RFC §"Collision-table convergence"). HABTM join
tables (`developers_projects`, `categories_posts`, and ad-hoc `*_*` join
scratch tables) are redefined with divergent shapes across many association test
files under parallel forks — a shared-DB collision surface. This story
de-collides them so the HABTM port stories (`assoc-habtm-canonical`,
`assoc-join-model-canonical`) can convert safely.

The rule (RFC): for every inline HABTM-join definition —

- **matches a canonical join table** (`developers_projects`/`categories_posts`,
  in `schema.rb`) → ride `TEST_SCHEMA` + the canonical model;
- **bespoke join shape** with no `schema.rb` analog → rename it file-unique
  (e.g. `<prefix>_<a>_<b>`) so it can never clobber a shared join table.
  Renaming a table is allowed; renaming a test is not.

Wide, shallow de-collision sweep — NOT a fidelity port.

## Acceptance criteria

- [ ] Inventory every inline HABTM-join table across the AR suite.
- [ ] Each occurrence rides a canonical join table (compatible) or is renamed
      file-unique (bespoke). No two files define the same join table with
      divergent shapes.
- [ ] Verify by co-running the affected HABTM siblings under `maxForks=1`.
- [ ] `pnpm lint` clean on touched files; no new `eslint-disable`.

## Notes

- Keep the PR under 500 LOC; batch by directory and register follow-up waves as
  new stories rather than fanning out sibling PRs.
- Does NOT remove files from the exclude JSON by itself — it unblocks the HABTM
  port stories that do.

## Definition of done

No file defines a HABTM join table with a shape diverging from the canonical
join tables; bespoke joins are file-unique. The affected siblings pass under
`maxForks=1`.
