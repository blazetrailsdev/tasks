---
title: "Wire TableNotSpecified (load_schema!) and AsynchronousQueryInsideTransactionError (async select) throw sites"
status: claimed
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["error-class-hierarchy-parity-gaps"]
deps-rfc: []
est-loc: 60
priority: 50
pr: null
claim: "2026-06-17T18:09:48Z"
assignee: "wire-tablenotspecified-async-error-throw-sites"
blocked-by: null
---

## Context

Follow-up to `error-class-hierarchy-parity-gaps` (PR #3217), which added the
`TableNotSpecified` and `AsynchronousQueryInsideTransactionError` classes for
hierarchy parity but did not wire their Rails throw sites.

Rails throws each at exactly one site:

- `TableNotSpecified` — `model_schema.rb` `load_schema!`:
  `raise ActiveRecord::TableNotSpecified, "#{self} has no table configured..."` `unless table_name`.
  Our `loadSchema` / `loadSchemaBang` (`model-schema.ts`) has no such guard.
- `AsynchronousQueryInsideTransactionError` — `database_statements.rb` `select`
  when `async && async_enabled? && current_transaction.joinable?`. Our `select`
  (`database-statements.ts`) ignores the `async` option and runs sync, so this
  is blocked on porting the `load_async` infrastructure.

## Acceptance criteria

- `loadSchema!` raises `TableNotSpecified` when `table_name` is nil, mirroring
  Rails; port the corresponding `model_schema_test` case verbatim.
- The async guard is wired only once `load_async` exists; if still unported,
  document the dependency and descope it from this story (do not stub).
