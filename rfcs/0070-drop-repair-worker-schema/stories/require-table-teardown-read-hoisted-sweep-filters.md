---
title: "require-table-teardown: read a sweep filter held in a variable"
status: done
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 5572
claim: "2026-07-29T16:35:45Z"
assignee: "require-table-teardown-read-hoisted-sweep-filters"
blocked-by: null
closed-reason: null
---

## Context

`require-table-teardown` reads a sweep's `LIKE` filter only out of a string or
template passed directly to an execution sink: `recordSinkSql`
(`eslint/require-table-teardown.mjs`) handles `arg.type === "Literal"` and
`"TemplateLiteral"` and ignores every other argument shape. So hoisting the
catalogue query to a variable — `const SWEEP_SQL = \`SELECT tablename FROM
pg*tables WHERE tablename LIKE 'ex*%'\`; await adapter.execute(SWEEP_SQL);`—
hides the filter,`sweptPrefixes`stays empty, and every prefixed create in the
file reports`missingTeardown` although the file does sweep them.

`require-canonical-rebuild` already handles exactly this shape: its `sqlTexts`
resolves an Identifier argument to its variable and returns the initializer AND
every later assignment, deliberately, because which write reaches the sink is
not decidable in a lint pass. Its rule doc states the rationale (hoisting to a
`const SWEEP_SQL` must not hide the query, while an expected-SQL assertion must
not arm anything).

This is the same under-accepting direction as the helper-form drop gap closed by
PR #5559 — noise rather than a leak — and the fix has the same shape: share the
existing resolver instead of writing a second one. PR #5559 established the
precedent by extracting `createSweepBinding` into `eslint/sweep-binding.mjs`
and the shared call-shape helpers into `eslint/sql-call-shapes.mjs`.

## Acceptance criteria

- A catalogue `LIKE` filter in a string held by a variable and passed to a sink
  arms the same prefixes as the inline spelling, including the assignment form
  (`let sql; sql = \`… LIKE 'ex\_%'\`;`).
- Prefer extracting/sharing `require-canonical-rebuild`'s `sqlTexts` over a
  second implementation; if it cannot be shared, say why in the PR body.
- A DDL string that never reaches a sink still arms nothing — the SQL-generation
  suites that assert on rendered `CREATE TABLE` text must stay quiet.
- Rule tests pin: a hoisted `const` filter crediting a prefixed create, a
  reassigned `let` filter doing the same, and an unexecuted filter string
  arming nothing.
- The header's KNOWN GAPS paragraph drops the "SQL built by concatenation or
  returned from a helper" clause's variable half (concatenation and helper
  returns remain accepted gaps).
