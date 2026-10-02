---
title: "parity: the void-return report credits a read of any method with the same name"
status: draft
updated: 2026-10-02
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8398 (`activerecord-converge-void-returns-adapters`).

`pnpm parity:api:returns` (`scripts/api-compare/report-void-returns.ts`) decides that "a Rails caller reads the return value" from `extract-return-uses.rb`, whose reads are keyed by Ruby method name within the package (`uses[row.package]?.[row.rubyName]`, `voidReturnRows`). A read of any method with that name flags every pair sharing the name, whatever the receiver.

Rows that were flagged only by a homonym, with the "first read" the report printed:

- `connection_adapters/abstract/connection_pool/reaper.rb#run` and `postgresql/oid/type_map_initializer.rb#run`: first read `activerecord/test/cases/fixtures_test.rb:616`, a different `run`.
- `postgresql/schema_dumper.rb#extensions(stream)`: first read `activerecord/lib/active_record/associations/association.rb:173`. The dumper hook's Rails value is always `nil` (`postgresql/schema_dumper.rb:8-17` ends in `stream.puts` inside an `if`), so trails#8398 had to type the port `Promise<null | undefined>` to leave the report.
- `schema_cache.rb#open`: first read `activerecord/lib/active_record/migration.rb:161`, `File.open`.
- `abstract/schema_definitions.rb#change`: first read `abstract/quoting.rb:202`, a `Time#change`.
- `postgresql/database_statements.rb#begin_db_transaction` / `#commit_db_transaction`: first reads in `test/cases/adapters/trilogy/trilogy_adapter_test.rb:320,340`, the Trilogy adapter's.

Rows still listed that look the same: `tasks/*_database_tasks.rb#create` (524 reads, first `aggregations.rb:243`), `log_subscriber.rb#sql` (141), `schema_dumper.rb#foreign_keys` (88).

## Acceptance criteria

- [ ] A read counts for a pair only when the call can reach that pair's method: at minimum the argument count fits the definition's arity, and a read with an explicit receiver whose class is known does not credit an unrelated class.
- [ ] A pair whose Rails body can only evaluate to `nil` (a bodiless `def`, or a tail that is `puts` / an `if` with no `else` ending in one) is not reported.
- [ ] The PR body lists the rows that leave the report and a hand verdict for each.
