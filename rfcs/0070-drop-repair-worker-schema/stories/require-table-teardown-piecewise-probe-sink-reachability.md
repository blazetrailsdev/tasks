---
title: "require-table-teardown: scope the piecewise-SQL probe to sink-reachable assemblies"
status: ready
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`eslint/piecewise-sql-population.test.mjs` (PR #5588) measures the population of
SQL strings assembled across statements — the four spellings
`createSqlTextGroups` cannot read: `sql += …`, `sql = sql + …`,
`` sql = `${sql}…` ``, and `parts.push(…)` joined at the sink. That measurement is
what justifies leaving the gap open in `eslint/sql-texts.mjs`.

The probe counts an assembly anywhere in an in-scope test file. The two teardown
rules, however, only read SQL that reaches an **execution sink** — that scoping is
deliberate and is what keeps SQL-generation suites and expected-SQL assertions
from being mislabelled as leaks (see the "Raw-SQL leaks" section of
`eslint/require-table-teardown.mjs`, and `SQL_SINKS` in
`eslint/sql-call-shapes.mjs`).

So the probe reports an upper bound rather than the population. This is sound for
the decision it backs — a zero upper bound proves a zero population, so
over-counting can only make the guard fire early, never let a real case through —
but it means an assertion-only assembly can fail the guard even though neither
rule would read it. Two such values already exist in the tree and are excluded
only incidentally:

- `packages/activerecord/src/query-transformers.test.ts:32` — `sql = t.call(sql,
null)` in a loop, then `expect(sql)`. Currently excluded because the probe
  requires a `+` chain or template for the self-reassign shapes, not because it
  noticed the value never reaches a sink.
- `packages/activerecord/src/test-fixtures.test.ts` — a `push`/`join` pair on
  `offenders`. Currently excluded only because that file is on the rules'
  `ignores`.

Either could stop being excluded for unrelated reasons, at which point the guard
fails over a value no rule reads.

## Acceptance criteria

- The probe counts an assembly only when the assembled variable can reach an
  execution sink, using `SQL_SINKS` from `eslint/sql-call-shapes.mjs` — do not
  restate the sink list.
- Reachability must not be so strict that it under-reads: an assembly reaching a
  sink through an alias or a single-argument wrapper still counts. Prefer
  over-counting to missing, for the reason the UPPER BOUND paragraph in the test
  gives.
- Plant an assertion-only assembly (`parts.push("SELECT …")` fed to `expect`) and
  show it does NOT fail the guard; plant a sink-reaching one and show it does.
- The measured population must remain zero, and the UPPER BOUND paragraph in the
  test's doc block updated to say what it now bounds.
- No new third-party deps; async fs only; no `node:*` imports; no `process.*`.
