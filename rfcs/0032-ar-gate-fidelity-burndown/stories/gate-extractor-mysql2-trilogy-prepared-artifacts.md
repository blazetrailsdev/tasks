---
title: "Fix extractor Mysql2/Trilogy collapse and prepared_statements over-exclusion"
status: draft
updated: 2026-07-05
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `gate-wrong-gate-body-convergence` (RFC 0032). Three remaining
`wrong-gate` rows are Ruby-extractor artifacts, NOT test-body bugs — the TS tests
gate correctly; the extracted railsGate is wrong:

- `adapters/abstract-mysql-adapter/connection.test.ts` "passing arbitrary flags
  to adapter" and "passing flags by array to adapter": rails `adapters=[none]` /
  ts `adapters=[mysql]`. Rails wraps these in `unless
current_adapter?(:TrilogyAdapter)` inside `AbstractMysqlTestCase`. The extractor
  collapses both Mysql2Adapter and TrilogyAdapter to "mysql", so `mysql AND
!mysql` intersects to the empty set. The tests correctly run on Mysql2 (mysql).
- `adapter.test.ts` "update prepared statement": rails `adapters=[mysql]` / ts
  `adapters=[mysql,sqlite]`. Rails runs it `unless PostgreSQL || (SQLite &&
!prepared_statements)`; the extractor cannot evaluate the runtime
  `!prepared_statements`, so it over-excludes SQLite. The ts gate (mysql+sqlite)
  is the real Rails condition.

Fix belongs in `scripts/test-compare/extract-ruby-tests.rb` (Mysql2-vs-Trilogy
distinction; and/or a known-artifact handling for runtime-only `!prepared_statements`
conditions), or add a small expected-mismatch allowlist consumed by the gate
comparison. Do NOT change the test bodies — they are correct.

## Acceptance criteria

- [ ] Resolve the Mysql2/Trilogy adapter-collapse so `unless TrilogyAdapter` does
      not produce an empty adapter set for these tests.
- [ ] Resolve the `!prepared_statements` over-exclusion for "update prepared
      statement" (extractor handling or allowlist).
- [ ] `test:compare --package activerecord --gates` reports no wrong-gate for
      these three tests, with test bodies unchanged.
