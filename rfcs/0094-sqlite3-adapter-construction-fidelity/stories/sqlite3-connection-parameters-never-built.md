---
title: "SQLite3Adapter never builds Rails' @connection_parameters"
status: draft
updated: 2026-08-09
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: ["activerecord"]
deps: ["sqlite3-constructor-connects-eagerly-unlike-rails"]
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter#initialize` ends by building `@connection_parameters` —
the derived hash `connect` later hands the driver
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:128-132`):

```ruby
@connection_parameters = @config.merge(
  database: @config[:database].to_s,
  results_as_hash: true,
  default_transaction_mode: :immediate,
)
```

`connect` then opens with it (`:846-852`), so "what the driver is opened with" is
computed once, in `initialize`, and is inspectable without connecting.

trails has no `@connection_parameters` on any adapter — a grep for
`connectionParameters` across `packages/activerecord/src/connection-adapters/`
returns nothing. `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
instead keeps the pieces as separate private fields set in the constructor
(`_filename` `:388`, `_readonly` `:389`, `_strict` `:390`, `_config` `:387`) and
re-derives the driver arguments inside `connect`. The two Rails-derived keys are
not represented at all:

- `results_as_hash: true` — trails' drivers are configured for row objects
  ad hoc at the call sites that read them.
- `default_transaction_mode: :immediate` — trails emits
  `BEGIN IMMEDIATE TRANSACTION` from the transaction path rather than carrying it
  as a connection parameter, so the driver default and the emitted statement can
  disagree.

This is the fourth symptom of the construction-path divergence this RFC collects:
because `initialize` connects immediately (`sqlite3-adapter.ts:400`), there was
never a moment between "config resolved" and "handle opened" for the derived hash
to exist in.

## Converged shape

`initialize` computes `_connectionParameters` from the resolved config exactly as
`sqlite3_adapter.rb:128-132` does, and `connect`/`reconnect` consume it rather
than re-deriving from `_filename` / `_readonly` / `_config`.

## Dependencies

Sequence after `sqlite3-constructor-connects-eagerly-unlike-rails` — the derived
hash is only meaningful once construction stops opening the handle in the same
breath.

## Acceptance criteria

- [ ] `SQLite3Adapter` holds a `_connectionParameters` member built in the
      constructor from the merge at `sqlite3_adapter.rb:128-132`, including the
      `results_as_hash` and `default_transaction_mode` keys.
- [ ] `connect` / `reconnect` open the driver from that member; no driver
      argument is re-derived from `_filename` / `_readonly` / `_config` at
      connect time.
- [ ] `default_transaction_mode` is the single source for the transaction mode —
      the `BEGIN IMMEDIATE` the transaction path emits reads it rather than
      hard-coding it.
- [ ] `sqlite3-adapter.hash-constructor.test.ts` and the sqlite3 adapter suites
      pass unchanged; no emitted-SQL change on any lane.
