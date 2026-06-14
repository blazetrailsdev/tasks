---
title: "Extract MySQL indexes introspection from mysql2-adapter into mysql/schema-statements"
status: draft
updated: 2026-06-14
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Remainder of `extract-mysql2-schema-introspection`. That story extracted
`columns` into `connection-adapters/mysql/schema-statements.ts` and hit the
500 LOC ceiling (code motion counts double), so `indexes` was deferred.

**This story (~87 moved lines):** move `indexes` and its private helper
`statisticsHasExpressionColumn` from `mysql2-adapter.ts` into
`connection-adapters/mysql/schema-statements.ts`, leaving the adapter
delegating. `indexes` reads `information_schema.statistics`;
`statisticsHasExpressionColumn` probes for the MySQL 8.0.13+ `EXPRESSION`
column. Reuse the existing `IntrospectionHost` host-interface pattern
established by the `columns` extraction (add back `_statisticsHasExpression`
to the host surface).

## Acceptance criteria

- [ ] `indexes` and `statisticsHasExpressionColumn` live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling.
