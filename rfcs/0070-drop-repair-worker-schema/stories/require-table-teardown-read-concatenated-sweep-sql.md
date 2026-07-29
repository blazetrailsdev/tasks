---
title: "require-table-teardown: read a sweep's SQL built by concatenation"
status: claimed
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-07-29T17:54:27Z"
assignee: "require-table-teardown-read-concatenated-sweep-sql"
blocked-by: null
closed-reason: null
---

## Context

`createSqlTextGroups` (`eslint/sql-texts.mjs`, added by #5576) resolves a sink
argument to the strings it can carry, but reads only three node shapes: a
`Literal`, a `TemplateLiteral`, and an `Identifier` holding one of those. SQL
built by `+` concatenation, or returned from a local helper, resolves to no
groups at all.

So a sweep spelled either way is invisible to `require-table-teardown`:

```ts
const dropSql = 'DROP TABLE IF EXISTS "' + t.tablename + '"';
await adapter.exec(dropSql);

const sweepSql = () => `SELECT tablename FROM pg_tables WHERE tablename LIKE 'ex_%'`;
const rows = await adapter.execute(sweepSql());
```

Neither arms `sawSweepDrop` nor contributes a prefix, so the file's prefixed
creates all report `missingTeardown`. This is the same under-accepting direction
as the gaps #5561, #5572 and #5576 closed — noise, not a leak — and is listed as
a KNOWN GAP in the rule's doc block (`eslint/require-table-teardown.mjs`, the
"SQL built by concatenation or returned from a helper" clause).

A `BinaryExpression` with `+` is the tractable half: each operand resolves
recursively and a non-string operand is a substitution, which is exactly the
quasi-boundary shape `createSqlTextGroups` already models — a concatenation
lowers to a quasi group directly. The helper-return half needs the callee's body
resolved and is a larger, separate question; scope this story to concatenation
and leave the helper clause in the doc block.

Rails anchor: `_` and `%` are LIKE wildcards that must be escaped when literal
(`vendor/rails/activerecord/lib/active_record/sanitization.rb:118`, `:132-137`;
tests `test/cases/sanitize_test.rb:63-80`) — the reason a name or pattern read
across a substitution must not be credited as static applies unchanged here.

## Acceptance criteria

- A sweep whose DROP half is built by `+` concatenation arms `sawSweepDrop`.
- A `LIKE` filter built by concatenation credits its prefix only when the
  pattern is closed within a single static operand; a pattern interpolated by
  concatenation (`"... LIKE 'ex" + suffix + "%'"`) credits nothing.
- A raw `CREATE TABLE` / `DROP TABLE` built by concatenation folds into the
  create/drop balance, with the dynamic-end rule preserved: `"DROP TABLE tmp_" +
suffix` names no knowable table.
- A concatenated string that never reaches a sink still arms nothing.
- `require-canonical-rebuild`'s joined reading must not change behaviour.
- Extend `createSqlTextGroups`; do not add a second resolver.
