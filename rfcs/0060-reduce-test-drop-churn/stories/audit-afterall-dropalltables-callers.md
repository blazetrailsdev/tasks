---
title: "Audit afterAll(dropAllTables) callers; drop where truncation reset covers"
status: draft
updated: 2026-07-03
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: ["truncate-based-global-reset"]
deps-rfc: []
est-loc: 120
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-on to `truncate-based-global-reset`. Four test-helpers files call
`afterAll(dropAllTables)` (`git grep -ln dropAllTables --
'packages/activerecord/src/**/*.test.ts'`):
`test-helpers/{define-schema,drop-all-tables,handler-resolved-adapter,schema-dumping-helper}.test.ts`.

`drop-all-tables.test.ts` and parts of `define-schema.test.ts` **self-test the
drop machinery itself** — their drops are legitimate and must stay (they exercise
`dropAllTables`/`defineSchema`, and are among the `test-helpers/*` files RFC 0059
retires last). But `handler-resolved-adapter.test.ts` and
`schema-dumping-helper.test.ts` use `afterAll(dropAllTables)` only to clean up
canonical state that the truncation reset now handles.

## Acceptance criteria

- Audit each of the 4 `afterAll(dropAllTables)` callers. Those that only reset
  canonical row/state → drop the `afterAll(dropAllTables)` and rely on the
  truncation reset. Those self-testing the drop machinery (`drop-all-tables.test`,
  `define-schema.test`) stay and are documented as intentionally retained.
- Net `DROP_TABLE` contribution from these files' teardown removed where not
  self-testing; no test renames; `test:compare` delta ≥ 0; all 3 lanes green.
