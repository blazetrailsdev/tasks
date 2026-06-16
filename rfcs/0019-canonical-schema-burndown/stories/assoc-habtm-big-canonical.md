---
title: "assoc-habtm-big-canonical"
status: claimed
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-16T16:43:31Z"
assignee: "assoc-habtm-big-canonical"
blocked-by: null
---

## Context

Split-out remainder of `assoc-habtm-canonical`. The small internal harness
`associations/habtm.test.ts` was converted to canonical + dropped from the
exclude JSON in the first PR. This story converts the large Rails-backed file:

- `associations/has-and-belongs-to-many-associations.test.ts` (~1892 LOC, 28
  tbl) -> `associations/has_and_belongs_to_many_associations_test.rb`

Structure (3 describe blocks, all named `HasAndBelongsToManyAssociationsTest`):

- Lines 41-1572: the bulk. `beforeEach` builds its own inline `Developer` /
  `Project` / `DeveloperProject` classes via `defineSchema` on
  `developer_projects` (note: non-canonical singular join name). ~12
  `defineSchema` call sites, several with bespoke scratch tables (countries/
  treaties/countries_treaties, custom join tables, etc.). This block also
  documents a known registry-key collision with the canonical block (see the
  `canonicalHabtmJoinModels` capture/restore hack at top of file).
- Lines 1573-1831: ALREADY canonical — uses
  `useHandlerFixtures(["developers","projects","developersProjects"])` +
  `name(:label)` lookups + `CanonicalDeveloper`/`CanonicalProject`. Use as the
  conversion template.
- Lines 1832-1892: `join table alias` / `join middle table alias` — `freshAdapter`
  - `defineSchema`. Small (~60 LOC, 2 tests).

Canonical schema already has `developers`, `projects`, `developers_projects`,
`categories`, `posts`, `categories_posts`, `tags`. Canonical
`Developer`/`Project` carry full `has_and_belongs_to_many` (developer.ts /
project.ts in test-helpers/models). Rails reference file is NOT checked into
this repo; port from the existing TS bodies (which already mirror Rails) keeping
test names verbatim.

## Acceptance criteria

- [ ] Convert all 3 describe blocks to canonical: no `defineSchema`, no
      `createTestAdapter`/`freshAdapter`. Use `setupHandlerSuite()` +
      `useHandlerFixtures([...])` + `name(:label)`.
- [ ] For any bespoke scratch table (countries/treaties, custom join tables):
      parity-check Rails `schema.rb` first — add to canonical `test-schema.ts`
      ONLY if schema.rb has it; otherwise a single scoped, file-unique
      `defineSchema` + teardown for that one table (never a shared name).
- [ ] Test names unchanged. No `eslint-disable`.
- [ ] Remove `has-and-belongs-to-many-associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json`.
- [ ] `pnpm lint` clean; `pnpm vitest run <file>` passes.

## Notes

- ~1892 LOC. May exceed 500 LOC even as schema-only diff; if so split per
  describe across sibling (non-stacked) PRs, removing from the exclude JSON only
  in the final PR once the whole file is clean.
