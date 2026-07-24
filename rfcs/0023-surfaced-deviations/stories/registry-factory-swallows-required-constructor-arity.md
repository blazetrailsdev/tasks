---
title: "type registry factory silently builds classes with required constructor positionals (OID::Vector)"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Type.register(:vector, OID::Vector, adapter: :postgresql)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1183`)
registers a class whose initializer is required-arity:
`OID::Vector#initialize(delim, subtype)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/vector.rb`).
In Rails, `Type.lookup(:vector)` therefore raises `ArgumentError` — the registry
calls `klass.new` with no positional args.

trails' `AdapterSpecificRegistry#register` builds the factory as
`(_symbol, ...args) => new klass!(...args)`
(`packages/activerecord/src/type/adapter-specific-registry.ts:171`), and TS has
no arity enforcement at runtime, so `lookup("vector", { adapter: "postgres" })`
silently returns a `Vector` with `delim === undefined` and
`subtype === undefined` instead of raising. #5206 registered `vector` for Rails
parity but deliberately asserted only `not.toThrow()` rather than enshrining the
lax construction as expected behavior
(`packages/activerecord/src/type.trails.test.ts`, "cover every type Rails
registers for the postgresql adapter").

The same silent-underapplication hazard applies to any other registered class
with required constructor positionals.

## Acceptance criteria

- Decide and implement the faithful behavior for looking up a type whose class
  needs constructor positionals the registry cannot supply — either the factory
  raises the way Ruby's `ArgumentError` does, or `Vector`'s constructor
  validates its own arguments.
- A test asserts the chosen behavior for `lookup("vector", { adapter: "postgres" })`
  and the `not.toThrow()` entry in `type.trails.test.ts` is tightened to match.
- Survey the other adapter-scoped registrations for the same required-positional
  shape and note or fix each.
