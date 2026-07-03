---
title: "convert-defineschema-behavior-test-helpers"
status: claimed
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-07-03T12:33:51Z"
assignee: "convert-defineschema-behavior-test-helpers"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 phase 3 split-out. The parent story
`convert-bespoke-defineschema-test-helpers` deferred two test-helpers files
because they do not merely _use_ `defineSchema` to lay a table — they _test
defineSchema's own behavior_, so a mechanical `create_table` swap would defeat
the test and force a rename (both forbidden):

1. `packages/activerecord/src/test-helpers/with-transactional-fixtures.test.ts`
   — 12 `defineSchema` references. Several beforeAll blocks create genuinely
   bespoke tables (cache_inval_users, raw_fixture_users, pertable_touched/
   untouched, opt_out_cache_users) that COULD become `create_table`. But two
   whole describe blocks exist solely to exercise defineSchema's per-adapter
   signature-cache WeakMap and its invalidation across transactional rollback:
   - "withTransactionalFixtures (defineSchema signature cache invalidation)"
   - "withTransactionalFixtures (preserves beforeAll signatures across rollback)"
     Their `it()` names literally call defineSchema inside the body as the
     subject under test. These likely die with `defineSchema` in phase 4 (like
     `define-schema.test.ts`), or need re-expressing against whatever replaces the
     signature cache.

2. `packages/activerecord/src/test-helpers/handler-resolved-adapter.test.ts`
   — 3 `defineSchema` references. The bespoke tables (handler_resolved_posts,
   handler_resolved_comments) are convertible, BUT the test
   "defineSchema(schema) without adapter arg creates the table via the handler"
   exists specifically to verify defineSchema resolves `Base.adapter` from the
   connectionHandler internally. Converting to `create_table` guts that
   assertion and the name can't change.

## Acceptance criteria

- Decide per describe block: (a) convert the pure table-creation beforeAlls to
  `connection.createTable(...)` + teardown drop, and (b) for the
  defineSchema-behavior describes/tests, either move them to be deleted in
  RFC 0059 phase 4 alongside `define-schema.test.ts`, or re-express them without
  a rename once the phase-4 removal path is decided. Coordinate with the phase-4
  `defineSchema` removal story rather than gutting the assertions here.
- End state: `git grep -c "defineSchema(" <both files>` -> 0.
- No test renames; `test:compare` delta >= 0.
- One PR per file if needed; <=500 LOC each; not stacked; from main.
