---
title: "through / nested-through associations → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-collection-cluster"]
deps-rfc: []
est-loc: 500
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the through / nested-through association files (RFC §Rollout phase 3).
Depends on `associations-collection-cluster` (shared through-models + canonical
join fixtures land there first).

Files (remove each from the exclude JSON as it lands):

- `associations/nested-through-associations.test.ts` → `nested_through_associations_test.rb`
- `associations/nested-through-advanced.test.ts` → nested-through advanced cases
- `associations/nested-through-preloader.test.ts` → nested-through preload cases
- `associations/polymorphic-sti-through.test.ts` → polymorphic STI through cases
- `associations/through-association-scope.test.ts` → through-scope cases
- `associations/source-type-validation.test.ts` → source-type cases
- `associations/constructor-form-and-hmt-insert.test.ts` → hmt insert/constructor cases

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes (co-run colliding siblings under `maxForks=1`);
      zero `require-canonical-schema` errors; files removed from the exclude JSON.

## Notes

- Nested-through impl already complete (memory `nested_through_already_done`); this
  is a schema/fixtures + body-fidelity conversion, not a feature build.
