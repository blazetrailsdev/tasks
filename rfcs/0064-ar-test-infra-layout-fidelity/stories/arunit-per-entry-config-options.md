---
title: "expandConfig: per-entry options instead of cloning arunit"
status: closed
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: implemented in #5397"
---

## Context

`expand_config` (`vendor/rails/activerecord/test/support/config.rb:26-37`)
expands the named entries that **already exist** under the selected connection
in `config.yml`, filling in only a missing `database` / `adapter`. Each entry
therefore keeps its own options, and `config.example.yml:3-40` shows they
differ: mysql2's `arunit` carries `collation: utf8mb4_unicode_ci` and
`variables: { time_zone: '+00:00' }` while `arunit2` carries
`collation: utf8mb4_general_ci` and no `variables`; postgresql's three entries
each carry `min_messages: warning`, with `prepared_statements: false` only on
`arunit_without_prepared_statements`.

trails' `expandConfig` (`packages/activerecord/src/support/connection.ts`,
added in #5397) clones the `arunit` hash for all three entries, setting only the
`arunit2` database and the third entry's `preparedStatements: false`. The
per-entry options above are therefore absent.

Note this is not a regression from #5397: the `CONNECTIONS` table in that file
has never carried `collation` / `encoding` / `variables` / `min_messages` for
any entry, so the clone drops nothing that used to be applied. Raised in review
on #5397 and deferred there as non-blocking.

## Acceptance criteria

- The `connections:` table carries per-entry option hashes as
  `config.example.yml:3-40` spells them, rather than one hash cloned three ways.
- `expandConfig` fills in only a missing `database` / `adapter` on an existing
  entry, as `config.rb:30-36` does (including the `sqlite3_mem` → `sqlite3`
  adapter fallback).
- mysql2 `arunit` / `arunit2` differ in `collation`, and `arunit` carries the
  `time_zone` variable; postgresql entries carry `min_messages`.
- Options that no trails adapter reads yet are still carried in the entry (the
  config is the port surface); note at the call site any that are inert.
