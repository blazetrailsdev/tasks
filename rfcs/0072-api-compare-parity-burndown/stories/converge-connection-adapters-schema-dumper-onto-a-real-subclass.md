---
title: "Converge ConnectionAdapters::SchemaDumper onto a real subclass and delete its inheritance exclude"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6140
claim: "2026-08-05T20:13:09Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

PR #6128 closed `resolve-last-activerecord-inheritance-mismatch-schema-dumper`
via arm 2 (record the exclusion). The convergence itself is still open, and the
exclude row is debt, not a settled decision:

`scripts/api-compare/inheritance-exclude.json` carries one entry —
`activerecord connection_adapters/abstract/schema_dumper.rb
ActiveRecord::ConnectionAdapters::SchemaDumper` — suppressing a `super-mismatch`.

Rails declares `class SchemaDumper < SchemaDumper`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_dumper.rb:5`);
the adapter-layer dumper subclasses `ActiveRecord::SchemaDumper`
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:10`), and the
base's `table` calls the private `column_spec` only the subclass defines.

trails ships **one** class instead: the adapter-layer members are `this`-typed
mixin functions over `SchemaDumperMixinHost`
(`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts:1-25`),
which `packages/activerecord/src/schema-dumper.ts:354` assigns onto its own
prototype through `protected` wrappers, and the adapter file re-exports the base
class. The blocker is an ESM temporal-dead-zone cycle: the base module imports
the adapter module's members, so the adapter module cannot `extends` the base.

The reason it is not a one-line fix: trails constructs the **base** class
directly — `SchemaDumper.dump`, `SchemaDumper.create`, and the bare-base path
(`synchronous-bare-base-dumper-construction`, RFC 0056) all build
`ActiveRecord::SchemaDumper` and rely on the mixed-in `columnSpec`. Rails only
ever constructs the adapter subclass, through
`connection.create_schema_dumper(options)`.

## Converged shape

`ConnectionAdapters::SchemaDumper` is a real subclass of `SchemaDumper` — the
mixin-host indirection and the `protected` wrappers on the base are deleted —
and every construction path goes through the adapter layer the way Rails' does
(`abstract/schema_dumper.rb:8-12`, `schema_dumper.rb:10`). Breaking the cycle
means the base module stops importing the adapter module: whatever the base
needs from `column_spec` it gets by dynamic dispatch on the instance, as in Ruby.

## Acceptance criteria

- [ ] `ConnectionAdapters::SchemaDumper` extends the base `SchemaDumper` with a
      real `extends`, no cyclic import, no mixin host.
- [ ] The bare-base construction path still works (RFC 0056) — or is itself
      converged onto `createSchemaDumper`.
- [ ] The `inheritance-exclude.json` entry is **deleted**; `pnpm parity:api:inheritance`
      stays green (the gate fails on the now-stale row if it is left behind).
- [ ] activerecord inheritance reports 210/210 with no exclusions.
