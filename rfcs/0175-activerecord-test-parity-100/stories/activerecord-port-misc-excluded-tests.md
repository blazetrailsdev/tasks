---
title: "activerecord: port the 23 remaining per-test exclusions (delegators, Rational, throw/catch, singleton class, …)"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: ["rational-value-quoting-analogue", "ruby-mutable-string-carrier"]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The remaining activerecord per-test exclusions, each with a reason that no longer holds or never did:

- `adapter_test.rb` — "transaction restores after remote disconnection"
  reason: These tests call the `remote_disconnect` helper, which only supports PostgreSQL and Mysql2/Trilogy — its `else` branch is `skip("remote_disconnect unsupported")`, so Rails never runs them on SQLite. A genuine remote disc
- `adapters/sqlite3/sqlite3_adapter_test.rb` — "supports extensions"; "respond to enable extension"; "respond to disable extension"
  reason: Rails' SQLite3::Database exposes load_extension / enable_load_extension via the sqlite3-ruby C bindings. better-sqlite3 does not expose the SQLITE_LOAD_EXTENSION entry points, so supports_extensions? / enable_extension /
- `relations_test.rb` — "where id with delegated ar object"; "where relation with delegated ar object"
  reason: Rails wraps the AR object in Class.new(SimpleDelegator) and where() unwraps it via the delegator protocol (relations_test.rb:835-847). No idiomatic JS analog: a Proxy could forward method_missing, but the bespoke query-b
- `query_cache_test.rb` — "query cache does not allow sql key mutation"
  reason: Asserts Ruby FrozenError on in-place mutation of the frozen sql payload string; JS strings are immutable by value, so the mutation cannot exist.
- `core_test.rb` — "inspect singleton instance"
  reason: Ruby per-object singleton class rendering (`#<Class:#<Topic:0x...>>`); JS has no singleton-class concept and no AR code participates in that rendering.
- `inherited_test.rb` — "super before filter attributes"; "super after filter attributes"
  reason: Ruby `inherited` lifecycle-hook `super` ordering around filter_attributes; TS has no class-inheritance hook (ruby-module-semantics, see api-compare conventions.ts).
- `scoping/named_scoping_test.rb` — "find all should behave like select"
  reason: Asserts Ruby Array#select == Array#find_all alias equivalence on the materialized relation; JS arrays have only .filter, so there is no distinct method to compare.
- `relation/where_test.rb` — "where with rational for string column"
  reason: Ruby Rational literal cast to a string column; JS has no Rational.
- `relation/with_test.rb` — "common table expressions are unsupported"
  reason: Rails' else-branch for adapters lacking CTE support; every adapter trails exercises (SQLite/PG/MySQL) supports CTEs, so the branch is unreachable.
- `adapters/postgresql/quoting_test.rb` — "quote rational"
  reason: Ruby Rational(3, 4) quotes to the string "3/4"; JavaScript has no Rational literal or stdlib type, so there is nothing to quote.
- `associations_test.rb` — "pretty print does not reload a not yet loaded target"
  reason: Uses Ruby's PP.pp / pretty_print over a not-yet-loaded collection proxy (associations_test.rb). Ruby's pretty-printer has no Node.js equivalent; the inspect-without-reload behavior is covered by the inspect test.
- `transactions_test.rb` — "throw from transaction commits"; "deprecation on ruby timeout outside inner transaction"
  reason: Ruby throw/catch is non-exceptional control flow that commits the transaction (unlike JS throw, which always causes rollback). There is no JS equivalent for throw/catch semantics.
- `transactions_test.rb` — "after current transaction commit multidb nested transactions"
  reason: Requires the ARUnit2Model secondary database connection (multi-database setup). The test asserts afterAllTransactionsCommit fires only after the outermost cross-database transaction commits — not available in the single-
- `dirty_test.rb` — "string attribute should compare with typecast symbol after update"
  reason: The test's whole point is that a Ruby symbol (`create!(catchphrase: :foo)` / `update_column :catchphrase, :foo`) type-casts to the string "foo" and so compares clean against the persisted value. JS has no auto-coercing s
- `dirty_test.rb` — "in place mutation detection"; "in place mutation for binary"; "mutating and then assigning doesn't remove the change"
  reason: All three mutate a string in place (`catchphrase << " matey!"`, `data << "bar"` on a serialized binary; dirty_test.rb:668/689/799). JS strings are immutable — there is no in-place string mutation to detect.
- `dirty_test.rb` — "getters with side effects are allowed"
  reason: The overridden reader persists as a side effect (`update_attribute` inside `def catchphrase`, dirty_test.rb:807) and the assertion relies on that write completing before the reader returns. trails persistence is async; a

Carriers that now exist: ruby-compat `DelegateClass`/`SimpleDelegator` (`packages/ruby-compat/src/delegate.ts`)
for the `relations_test.rb` delegator cases; `catch`/`throw` (`kernel-catch.ts`, RFC 0148, closed) for the
`transactions_test.rb` throw/catch pair; `rbObjSingletonClass` (CLAUDE.md § "`singleton_class` is a
per-object subclass") for `core_test.rb`; actionpack's `ActionController::Parameters#to_unsafe_h` for
`hstore_test.rb`; `rational-value-quoting-analogue` (RFC 0082) for the two Rational cases;
`ruby-mutable-string-carrier` (RFC 0155) for the frozen-string and in-place-mutation cases.

## Acceptance criteria

- [ ] Each case is ported with Rails' body and its entry deleted, or — where its carrier story is still open — its reason is rewritten to name that story.
- [ ] `base_test.rb`'s 16-test mixed entry is split per reason first.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
