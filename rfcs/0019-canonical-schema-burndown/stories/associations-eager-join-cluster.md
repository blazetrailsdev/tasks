---
title: "eager / join / habtm → canonical schema + Rails fixtures"
status: done
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 500
priority: 8
pr: 3117
claim: "2026-06-11T12:30:52Z"
assignee: "associations-eager-join-cluster"
blocked-by: null
---

## Context

Convert the eager-loading / join / HABTM association files (RFC §Rollout phase 3).
`eager.test.ts` (~5585 LOC) and `has-and-belongs-to-many-associations.test.ts` are
huge — split per-`describe` across sibling PRs off `main`. Heavy shared-table /
HABTM-join collision surface → depends on `shared-table-convergence`.

Files (remove each from the exclude JSON as it lands):

- `associations/eager.test.ts` → `associations/eager_test.rb` (split)
- `associations/cascaded-eager-loading.test.ts` → `associations/cascaded_eager_loading_test.rb`
- `associations/join-model.test.ts` → `associations/join_model_test.rb`
- `associations/left-outer-join-association.test.ts` → `associations/left_outer_join_association_test.rb`
- `associations/loader-methods.test.ts` → eager loader-method cases
- `associations/required.test.ts` → `associations/required_test.rb`
- `associations/extension.test.ts` → `associations/extension_test.rb`
- `associations/habtm.test.ts` → `habtm_destroy_order_test.rb` + HABTM cases in `associations/has_and_belongs_to_many_associations_test.rb`
- `associations/has-and-belongs-to-many-associations.test.ts` → `associations/has_and_belongs_to_many_associations_test.rb` (split)

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes (co-run colliding siblings under `maxForks=1`);
      zero `require-canonical-schema` errors; files removed from the exclude JSON.

## Notes

- `extension.test.ts` is a documented `posts`-collision file; the last blocker
  (Comment OopsExtension default-scope) per memory `extension_fixture_parity_partial`
  may keep one describe excluded — register a follow-up if so.
- HABTM eager work has prior art (#2521/#2827); reuse canonical Post/Category/
  Categorization fixtures + `dropExisting` recreate pattern.
- Multi-PR by necessity; register continuation stories with `pnpm tasks new`.
