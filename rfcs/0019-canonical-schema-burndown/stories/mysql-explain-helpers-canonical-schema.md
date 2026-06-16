---
title: "Converge mysql-explain.test.ts trails-only EXPLAIN probes to canonical schema"
status: ready
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts`
(merged in PR #3483) contains a `describe("explain helpers (trails-only)")`
block of TS-only EXPLAIN-plumbing probes that use **bespoke `defineSchema`
tables** rather than the canonical `TEST_SCHEMA`:

- `ex_rel_mysqls` (mysql-explain.test.ts:~128)
- `ex_mysql_authors`, `ex_mysql_books` (mysql-explain.test.ts:~151)

These violate the `blazetrails/require-canonical-schema` rule (RFC 0019). They
exercise our `buildExplainClause` / `Relation#explain` → `sql.active_record`
pipeline (backtick-quoting, preload-query capture) and have **no Rails
counterpart** — Rails' `MySQLExplainTest` has only the 3 fixture-backed methods

- `test_explain_for_one_query` + `test_explain_with_eager_loading`, all on
  canonical `authors`/`posts`.

PR #3483 deliberately relocated these probes to a sibling block (outside the
`MySQLExplainTest` describe) so transactional fixtures don't wrap their DDL and
so test:compare doesn't read them as class members. It did **not** convert the
schema — out of scope for the wrong-describe fix.

## Acceptance criteria

- The `explain helpers (trails-only)` probes either ride canonical tables
  (`authors`/`posts` via `useHandlerFixtures`/models) or canonical-schema
  additions, with no inline `defineSchema` of invented tables.
- The backtick-quoting and preload-capture assertions are preserved (they are
  the discriminating checks vs the `toSql()` fallback path).
- `blazetrails/require-canonical-schema` passes for the file with no exclude
  entry needed; `pnpm test:compare` activerecord delta stays non-negative.
