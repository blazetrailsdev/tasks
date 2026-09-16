---
title: "converge-fixture-module-fk-refs-onto-identify"
status: draft
updated: 2026-09-16
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#7843, `TableRow#resolveStiReflections` (`packages/activerecord/src/fixture-set/table-row.ts`, belongs_to arm) still carries a trails-only branch: a `ref(table, label)` placed directly in a foreign-key column is resolved through `FixtureSet.identify(label, fkType)`. Rails' `resolve_sti_reflections` (`vendor/rails/activerecord/lib/active_record/fixture_set/table_row.rb:154-177`) only resolves a label read from the association name and leaves explicit FK values alone; Rails fixtures spell those as ERB `<%= ActiveRecord::FixtureSet.identify(:label) %>`.

~60 FK-column `ref()` sites remain in `packages/activerecord/src/test-helpers/fixtures/*.ts` (cpk-books, doubloons, dead-parrots, faces, cpk-order-tags `tag_id`, price-estimates, member-details, memberships, courses, ships, other-comments, pirates, sharded-comments, parrots, sponsors, mateys, treasures, interests, sharded-blog-posts). #7843 already converted the join-table / sharded / cpk_reviews modules.

## Acceptance criteria

- Each remaining FK-column `ref()` in the fixture modules is spelled as its Rails `.yml` spells it (`FixtureSet.identify(label)` / association-name label / `composite_identify`).
- The FK-column `isFixtureRef` branch in `TableRow#resolveStiReflections` is deleted.
- `test-fixtures.test.ts` "every ref() points at a table that is itself loadable by name" is reconsidered (refs are its input).
