---
title: "Migration has no method_missing dispatch, so every adapter statement needs a hand-written forwarder"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7288 (RFC 0119,
`sqlite3-virtual-table-schema-load-through-schema-define`).

Rails' `Migration` reaches every schema statement the connection defines through
`method_missing`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1005-1021`), so a
`Schema.define` block can call `create_virtual_table`, `create_enum`,
`add_enum_value`, `create_schema` — anything the adapter answers — with no
per-method declaration anywhere.

trails hand-writes a forwarder per statement on `Migration`
(`packages/activerecord/src/migration.ts`): `createTable`, `createEnum`,
`dropEnum`, `enableExtension`, `disableExtension` and the rest, each repeating
the same `this._pt(name)` + arity-fan-out shape. `pnpm parity:api:extra` counts
49 `moved` names on `migration.ts` — Rails defines those names on the adapter's
`SchemaStatements`, not on `Migration`.

The consequence is a real hole, not just duplication: a statement with no
hand-written forwarder is simply absent from the DSL. `createVirtualTable`
(`sqlite3/schema_statements.rb`) had none, so
`adapters/sqlite3/virtual-table.test.ts`'s `schema load` had to be written as
`schema.methodMissing("createVirtualTable", ...)` — the Rails delegation spelled
out by hand, because adding the 50th forwarder would have raised the
extra-surface `total` the ratchet holds at 872. Every future adapter statement
faces the same choice: raise the mark, or make callers spell `methodMissing`.

`Migration#methodMissing` already exists and already does Rails' work —
`proper_table_name` on `args.first`, `say_with_time`, the `respond_to_missing?`
gate against the execution strategy. What is missing is the dispatch that makes
it fire on an undeclared name.

## Converged shape

Wrap `Migration` (and therefore `Schema`, its subclass) in a `Proxy` whose `get`
trap falls through to the existing `methodMissing` for any name the instance
does not answer and the connection does. That is the settled JS analogue of
Ruby `method_missing`, and it is what lets the hand-written forwarders be
deleted rather than multiplied — each deletion is a `moved` name off
`migration.ts`, so the extra-surface `total` only shrinks.

Check before starting whether a `Proxy` return from the constructor breaks
`instanceof`, the `registerVersion` / `Current` subclass chain, or
`CommandRecorder`'s `respondToMissing` path — those are the three places that
reflect over `Migration` today. If a `Proxy` is genuinely unworkable, the
fallback is to keep the forwarders and carry ONE receipt naming this story,
not to leave the DSL hole.

Deleting the forwarders is the point; do not close this by adding
`createVirtualTable` beside `createEnum`.

## Acceptance criteria

- [ ] A `Schema.define` block can call any statement the connection defines
      without a hand-written forwarder on `Migration`.
- [ ] `adapters/sqlite3/virtual-table.test.ts`'s `schema load` calls
      `schema.createVirtualTable("emails", "fts5", [...])` directly; the
      `methodMissing` spelling is gone.
- [ ] The existing hand-written forwarders that add nothing over
      `methodMissing` are deleted, and `pnpm parity:api:extra:gate` reports
      activerecord's `total` DOWN from 872 (tighten with
      `pnpm parity:api:extra:tighten`, never up).
- [ ] `instanceof Migration`, `registerVersion` / `Current`, and
      `CommandRecorder` reversal all still work; `migration.test.ts`,
      `invertible-migration.test.ts` and `command-recorder.test.ts` stay green
      on all three adapters.
