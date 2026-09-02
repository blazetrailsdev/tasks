---
title: "migration-delegators-belong-on-current-not-migration"
status: draft
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration` in Rails declares none of the schema statements — it
reaches the connection through `method_missing`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1006-1019`). trails
has no `method_missing` for TS callers, so `migration.ts` declares ~52 explicit
delegators on `class Migration`, every one of which `parity:api:extra` scores as
`moved`.

Four of them — `createTable` (:368), `changeTable` (:397), `createJoinTable`
(:782), `dropTable` (:812) — are ALSO where Rails puts the compatibility seam:
`Migration::Current` (migration.rb:579-608) overrides exactly those four to wrap
the yielded table definition in `compatible_table_definition(t)`.

`migration-current-nested-class-holds-table-overrides` added `Current` with the
four overrides, so the seam now exists and delegates up. What it could NOT do
inside its budget is DELETE `Migration`'s copies: every trails migration in the
repo and in user code is `class X extends Migration`, and removing the
delegators from `Migration` takes the whole method_missing-substitute surface
with them. So the four keep their `@noRailsEquivalent CONVERGEABLE` receipts,
now pointing here.

## Acceptance criteria

- [ ] Decide how a TS `class X extends Migration` reaches a schema statement
      Rails routes through `method_missing` — either every migration inherits
      from `Current` (matching `Migration[version]`, migration.rb:629-631, which
      is the only supported way to subclass in Rails) or the delegator block
      moves wholesale.
- [ ] `Migration`'s `createTable` / `changeTable` / `createJoinTable` /
      `dropTable` are deleted and their `@noRailsEquivalent CONVERGEABLE`
      receipts come out with them.
- [ ] `pnpm parity:api:extra:tighten` writes activerecord's `total` mark DOWN.
