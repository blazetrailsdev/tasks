---
title: "unprepared-statement-reuse-proposal"
status: ready
updated: 2026-11-18
rfc: "0241-request-path-performance"
cluster: null
packages: []
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

`unpreparable-select-statement-compile-cost` measured one `prepare` of the
twelve-dollar feed query (`examples/twelve-dollar-server/bench/prepare.mjs` vs
`prepare.rb`, 2026-11-17): better-sqlite3 13 (SQLite 3.53.4) 54.9 µs, the
`sqlite3` gem 2.10.1 (SQLite 3.54.1) 22.0 µs, 2.5×. `select 1` is 13.3 µs vs
2.6 µs, so ~10 µs of fixed per-statement setup sits in better-sqlite3's native
`Statement` construction (not in trails' wrapper,
`packages/activerecord/lib/sqlite/better-sqlite3.ts`), and the rest is SQLite's
compile plus build options. Rails does not cache unprepared statements
(`activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:92-107`).

## Acceptance criteria

- [ ] Write the proposal into RFC 0241's Design section: reuse compiled
      statements for unpreparable queries whose SQL carries bind placeholders,
      as a recorded deviation from `database_statements.rb:92-107`.
- [ ] Operator rules on it; only then implement behind that ruling.
- [ ] Re-measure `_freshStatement`'s share of busy CPU with the slim harness.
