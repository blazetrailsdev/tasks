---
title: "has-many / belongs-to / has-one / collection → canonical schema + fixtures"
status: done
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 8
pr: 3116
claim: "2026-06-11T02:42:48Z"
assignee: "associations-collection-cluster"
blocked-by: null
---

## Context

Convert the core association files (RFC §Rollout phase 3). The largest and most
collision-prone group — `has-many-associations` and `has-many-through` are huge
(split per-`describe` across sibling PRs off `main`). Depends on
`shared-table-convergence` (shared `posts`/`people`/HABTM tables).

Files (remove each from the exclude JSON as it lands):

- `associations.test.ts` → `associations_test.rb`
- `associations/has-many-associations.test.ts` → `has_many_associations_test.rb` (split)
- `associations/has-one-associations.test.ts` → `has_one_associations_test.rb`
- `associations/belongs-to-associations.test.ts` → `belongs_to_associations_test.rb`
- `associations/has-many-through-associations.test.ts` → `has_many_through_associations_test.rb` (split)
- `associations/collection-proxy.test.ts` → `has_many_associations_test.rb` (CollectionProxy cases)
- `associations/collection-proxy-count.test.ts` → `has_many_associations_test.rb` (count cases)
- `autosave-association.test.ts` → `autosave_association_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes (co-run colliding siblings under `maxForks=1`);
      zero `require-canonical-schema` errors; files removed from the exclude JSON.

## Notes

- `autosave-association.test.ts` declares `people:{name,first_name}` (RFC Phase-1
  rename target) — must be converged first.
- Multi-PR by necessity; register continuation stories with `pnpm tasks new`.
