---
title: "association-scope.test.ts → canonical (rewrite resolver edge cases onto canonical STI/polymorphic tables)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the blocked `associations-scope-cache-cluster`. Hardest file
(~1167 LOC), likely multiple PRs. `associations/association-scope.test.ts`
unit-tests the internal scope resolver (`AssociationScope`/`ReflectionProxy`)
with a large bank of synthetic prefixed tables, each encoding a distinct
resolver scenario:

- `wr_*` write reflection, `st_*`/`np_*` STI + namespaced polymorphic (incl. a
  uuid string primary key, `np_photos.primaryKey: ["uuid"]`), `ho1_*`
  has-one-through chains, `hs_*` has-many-through, `hot_*` hot-path hooks,
  `mg_*` multi-grouping, `int_*` intersection, `pst_*` polymorphic.

No dedicated Rails file (covered across the association suites). Blocker: these
schemas have no 1:1 canonical analog, and `eslint-disable` is rejected. Each
scenario must be re-expressed on an existing canonical construct that reproduces
the same resolver shape — canonical already has STI, polymorphic
(`faces`/`taggings`/`images`), through chains, and composite/uuid-PK tables
(`cpk_*`, `string_key_objects`, `guids`). Where a scenario has no canonical
analog, decide per-case: re-model onto the nearest canonical shape that still
exercises the branch, or escalate. Split per scenario-group (one PR per
`wr_/st_/np_/...` family), each off `main` with non-overlapping describes.

## Acceptance criteria

- [ ] Every `defineSchema` table references a canonical table (or a per-scenario
      rewrite onto one); no synthetic prefixed tables; no `eslint-disable`.
- [ ] Resolver assertions preserved; test names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from the exclude JSON.
