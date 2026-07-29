---
title: "require-table-teardown: read a sweep's SQL returned from a local helper"
status: in-progress
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 5587
claim: "2026-07-29T18:35:32Z"
assignee: "require-table-teardown-read-helper-returned-sweep-sql"
blocked-by: null
closed-reason: null
---

## Context

`createSqlTextGroups` (`eslint/sql-texts.mjs`) resolves a sink argument to the
strings it can carry: a `Literal`, a `TemplateLiteral`, a `+` chain over those
(#5581), and an `Identifier` holding one. SQL **returned from a local helper**
still resolves to no groups, so a sweep spelled

```ts
const sweepSql = () => `SELECT tablename FROM pg_tables WHERE tablename LIKE 'ex_%'`;
const rows = await adapter.execute(sweepSql());
```

arms nothing and contributes no prefix — the file's prefixed creates all report
`missingTeardown`. This is the last clause of the KNOWN GAP paragraph in
`eslint/require-table-teardown.mjs` ("SQL returned from a helper, since
resolving that needs the callee's body"), and the same under-accepting
direction #5561, #5572, #5576 and #5581 closed: noise, not a leak.

Resolving it needs the callee's body: resolve the callee identifier to its
function binding, then read the `return` expressions (and the concise-body
expression of an arrow) through the same `sqlTextGroups` recursion. The `seen`
set already guards recursion. Open questions the story must settle: a callee
with several returns is a fan-out (the existing multi-group shape covers it); a
callee taking parameters that reach the SQL should read those as substitutions
rather than resolving them; a non-local (imported) callee stays a dead end.

The `+` concatenation half established the quasi-boundary rule this must keep:
a name or LIKE pattern read across a substitution is never credited as static
(`vendor/rails/activerecord/lib/active_record/sanitization.rb:118`, `:132-137`;
tests `test/cases/sanitize_test.rb:63-80` — `_` and `%` are LIKE wildcards).

## Acceptance criteria

- A sweep whose SELECT half is returned from a local helper credits its prefix.
- A sweep whose DROP half is returned from a local helper arms `sawSweepDrop`.
- A helper parameter that reaches the SQL reads as a substitution, so a pattern
  interpolated through one credits nothing and a name flush against one names
  no knowable table.
- An imported or otherwise unresolvable callee stays a dead end and arms
  nothing.
- Extend `createSqlTextGroups`; do not add a second resolver.
- `require-canonical-rebuild`'s joined reading must not regress.
- Drop the helper clause from both rules' KNOWN GAP paragraphs once closed.
