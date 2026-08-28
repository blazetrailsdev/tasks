---
title: "A ported adapter override that is never exported/assigned is silently dead; nothing detects it"
status: ready
updated: 2026-08-28
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6315 hit a CI failure that took a full round-trip to diagnose, and the root
cause is a failure mode nothing currently detects: **a ported Rails override
that is never wired to its adapter is silently dead, and the abstract method
runs instead.**

The instance: Rails' SQLite3 adapter overrides the index-name length check to
exempt internal calls —

```ruby
def validate_index_length!(table_name, new_name, internal = false)
  super unless internal
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb:139-141`)

trails had that body ported in
`packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts`,
but the function was declared `function validateIndexLengthBang(...)` — not
`export`ed, and not assigned onto `SQLite3Adapter` the way its file-mate
`validTableDefinitionOptions` is. Its `this` type was wrong too
(`{ adapter: DatabaseAdapter }` rather than the adapter), which is only possible
because nothing ever called it. So `AbstractSchemaStatements`'
unconditional check ran, and `ColumnsTest#test_change_column_with_long_index_name`
(`vendor/rails/activerecord/test/cases/migration/columns_test.rb:255-264`)
broke the moment `copyTableIndexes` started routing through `addIndex`.

It was invisible for as long as it was: the only caller that would have reached
it hand-built its SQL and never went through `add_index_options`.

## Converged shape

A check that every module-scope function in an adapter's mixin file
(`connection-adapters/<adapter>/*.ts`) which mirrors a Rails method is actually
reachable from the adapter class — either exported and assigned, or referenced
by a file-mate. The trails mixin idiom (`this`-typed functions assigned to the
class, see CLAUDE.md "Module mixins") makes "declared but never assigned" a
mechanical, detectable state, and `parity:api`'s manifest already knows which
TS names mirror which Ruby methods, so the population is available.

An eslint rule alongside the existing `blazetrailsdev/rails-*` rules, or a
`scripts/parity` check, are both plausible shapes; pick whichever the manifest
supports most directly.

## Acceptance criteria

- [ ] A check fails on a Rails-mirroring module function in an adapter mixin
      file that is neither exported nor referenced within its own file.
- [ ] Running it over `packages/activerecord/src/connection-adapters/**` today
      reports zero (the one known instance was fixed in #6315) — or reports real
      further instances, which are then wired.
- [ ] A regression fixture pins the failure: reverting the `export` +
      class-assignment of `validateIndexLengthBang` reds the check.

## Re-verified 2026-08-17 (draft sweep)

Still valid — nothing detects an unwired override. See the note on
`detect-dual-spelling-dead-overrides`: same failure class (dead ported body),
different detector.
