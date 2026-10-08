---
title: "activerecord: the adapter-facts section does not cover lookup_cast_type_from_column's verify! or mismatched_foreign_key"
status: claimed
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-08T20:49:01Z"
assignee: "adapter-facts-section-does-not-cover-verify-or-mismatched-foreign-key"
blocked-by: null
closed-reason: null
---

## Context

trails#8685 added CLAUDE.md § "Adapter facts are prewarmed and peeked". It
names `lookup_cast_type`, `max_identifier_length`, `quote_string` and
`InsertAll#primary_keys`. The owner's ruling (2026-10-08 blocked-story triage,
decision 6) also covered two sites the section does not name, so their stories
could not be closed against it:

- `PostgreSQL::Quoting#lookup_cast_type_from_column`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:189-192`)
  runs `verify! if type_map.nil?`, which connects and loads the type map.
  trails' `lookupCastTypeFromColumn`
  (`packages/activerecord/src/connection-adapters/postgresql/quoting.ts:173`) is
  synchronous and omits it. Story:
  `pg-lookup-cast-type-verify-when-type-map-unloaded`.
- `AbstractMysqlAdapter#mismatched_foreign_key`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:1001-1015`),
  reached from the synchronous `translate_exception` (`:832-835`), looks up a
  primary-key column through `mismatched_foreign_key_details`. trails'
  `mismatchedForeignKey` (`abstract-mysql-adapter.ts:1322`) returns the error
  or a promise of it. It has no warm step to peek at, so it does not fit
  "prewarm and peek" as written. Story:
  `mysql-mismatched-fk-sql-arm-returns-a-promise`.

## Acceptance criteria

- `lookupCastTypeFromColumn`: either the type map is shown to be warm on every
  path that reaches it and the omitted `verify!` is receipted
  `@missingRailsCall verify! — PERMANENT` with a sentence in the section, or
  the cold path is given a defined answer.
- `mismatchedForeignKey`: either a synchronous shape is found (the details are
  only needed when the error message is built, which Rails defers through
  `query_parser` when `sql` is nil), or the value-or-promise return is added to
  the section with its receipt.
- Both stories are closed or re-pointed by the PR.
