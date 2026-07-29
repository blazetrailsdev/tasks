---
title: "require-table-teardown: read a sweep's DROP half held in a variable"
status: claimed
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-07-29T17:15:47Z"
assignee: "require-table-teardown-read-hoisted-sweep-drops"
blocked-by: null
closed-reason: null
---

## Context

PR #5572 taught `require-table-teardown` to resolve a sink argument held in a
variable, but only for the sweep's FILTER half. In `recordSinkSql`
(`eslint/require-table-teardown.mjs`), the `Identifier` branch runs the resolved
texts through `sweepPrefixMatchers` only — it does not call `recordText`, so a
resolved string contributes no create name, no drop name, and never sets
`sawSweepDrop`.

So the drop half hoisted to a variable is still invisible:

```ts
for (const t of rows) {
  const dropSql = `DROP TABLE IF EXISTS "${t.tablename}"`;
  await adapter.exec(dropSql);
}
```

`hasDynamicDropName` never sees that text, `sawSweepDrop` stays false, and the
file's prefixed creates all report `missingTeardown` even though the filter half
now resolves fine. Same under-accepting direction as the gap #5572 closed —
noise, not a leak.

The blocker is real, not incidental: `recordText` needs the `nextTexts`
dynamic-end signal to decide whether a name sitting at a quasi boundary is
complete, and `createSqlTexts` returns strings with no node attached.
`separateQuasis` (added in #5572) already yields quasis one at a time, so the
missing piece is carrying the per-quasi successor texts alongside — i.e. having
the resolver return quasi arrays rather than a flat string list for the callers
that need boundary information.

Rails anchor: `_` and `%` are LIKE wildcards that must be escaped when literal
(`vendor/rails/activerecord/lib/active_record/sanitization.rb:118`, `:132-137`;
tests `test/cases/sanitize_test.rb:63-80`) — the same reason #5572 refuses to
read an interpolated pattern as a static prefix applies to reading a name across
a substitution here.

## Acceptance criteria

- A sweep whose `DROP TABLE` template is held in a variable and passed to a sink
  arms `sawSweepDrop`, so the file's prefixed creates stop reporting.
- A raw `CREATE TABLE` / `DROP TABLE` in a hoisted string is folded into the
  create/drop balance the same way the inline spelling is.
- The dynamic-end rule is preserved across the resolved path: a name flush
  against a substitution (`DROP TABLE tmp_${suffix}`) is still not a knowable
  name, and an interpolated `LIKE` pattern still credits no prefix.
- A hoisted DDL string that never reaches a sink still arms nothing.
- Prefer extending `createSqlTexts` in `eslint/sql-texts.mjs` over a second
  resolver; `require-canonical-rebuild`'s joined reading must not change
  behaviour.
