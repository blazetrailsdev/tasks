---
title: "rebuild-canonical-tables-drop-order-comment"
status: ready
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
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

`rebuildCanonicalTables`
(`packages/activerecord/src/test-helpers/canonical-schema.ts:2103-2107`)
documents its drop loop as "drop in reverse registry order (FK-referencing
tables before their targets), then recreate forward so targets exist first."
That comment asserts a guarantee the registry order does not provide: the
registry is roughly alphabetical, not topological. `lessons_students`
(`canonical-schema.ts:989`) is registered _before_ `students`
(`canonical-schema.ts:994`) — referencer before target — so the reverse-order
loop drops `students` first for that pair, the opposite of what the comment
claims.

It is inert today: `buildCanonicalRegistry` emits zero `addForeignKey` /
`t.foreignKey` calls (`grep -c foreignKey canonical-schema.ts` = 0), so no
canonical table carries a persisted FK constraint and no drop order can
violate one. It becomes reachable only if a caller invokes
`rebuildCanonicalTables` while a _test-added_ FK is still live — e.g. the
`addForeignKey("lessons_students", "students")` in
`packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts`
(MySQLAnsiQuotesTest "foreign keys method with ansi quotes") if that test ever
lost its own `finally` drop. Raised in review of #5259, which is the first
`*.test.ts` call site to pass this FK pair through the helper.

## Acceptance criteria

- Either make the drop order actually FK-safe (topological, or drop with FK
  checks suspended), or correct the comment to state what the loop really
  guarantees — registry order reversed, which is FK-safe only because the
  canonical registry declares no foreign keys.
- If the comment route is taken, note the invariant it depends on (registry
  emits no FKs) so a future FK-bearing canonical table trips review.
- No behavior change expected for existing callers; no test renamed.
