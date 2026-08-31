---
title: "async-overrides-of-synchronous-rails-adapter-methods"
status: claimed
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-31T13:54:11Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

A cluster of adapter members carry `@noRailsEquivalent` because the port
overrides, per adapter, a method Rails defines once on the abstract class — the
override existing only because the body became async:

- `abstract-mysql-adapter.ts` / `postgresql-adapter.ts` —
  `AbstractAdapter#case_insensitive_comparison` (abstract_adapter.rb:814),
  overridden async because the collation / `pg_proc` lookup queries
- `postgresql-adapter.ts` / `sqlite3-adapter.ts` — `AbstractAdapter#verify!`
  (abstract_adapter.rb:759), re-implemented per adapter because the port's
  `active` getter is sync and cannot ping
- `sqlite3-adapter.ts` — `AbstractAdapter#raw_connection`
  (abstract_adapter.rb:798) under a non-Rails name, and the
  `DatabaseStatements#raw_execute` override (abstract/database_statements.rb:552)
  keeping the batch arm adapter-local
- `abstract-mysql-adapter.ts` — `Mysql2Adapter#text_type?`
  (mysql2_adapter.rb:140-142) hoisted to the abstract class
- `connection-adapters/abstract/schema-statements.ts` —
  `#index_name_for_remove` (abstract/schema_statements.rb:1647) and
  `#index_exists?` (:102) taking already-fetched indexes because the port cannot
  re-query synchronously

## Acceptance criteria

- Each override is folded back into the Rails method on the class Rails defines
  it on, and its `@noRailsEquivalent CONVERGEABLE
async-overrides-of-synchronous-rails-adapter-methods` receipt is deleted.
- Split across as many PRs as the LOC ceiling needs.
