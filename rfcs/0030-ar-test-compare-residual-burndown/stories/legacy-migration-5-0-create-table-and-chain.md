---
title: "legacy-migration-5-0-create-table-and-chain"
status: done
updated: 2026-06-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 9000
pr: null
claim: "2026-06-22T02:21:13Z"
assignee: "legacy-migration-5-0-create-table-and-chain"
blocked-by: null
---

## Context

> **DESCOPED — won't do (pre-release, no legacy-version support).** trails is
> pre-release and only targets the current Rails migration schema version. We do
> not support migrating against old Rails versions, so the
> `ActiveRecord::Migration::Compatibility` version-shim ladder (`V5_0`, `V5_1`,
> … `V7_x`) is intentionally not being ported. Confirmed against trails
> origin/main: there is **no `V5_0` class**; the version registry in
> `packages/activerecord/src/migration/compatibility.ts` only registers
> `Current` (see `registerVersion(CURRENT_VERSION, Current)` in
> `packages/activerecord/src/migration.ts`). The premise PR #3524 referenced
> below is not on origin/main. This story (and its sibling legacy-version
> stories) is obsolete; priority is set to 9000 so it stays out of the ready
> queue. Do not re-refine — there is no Rails-fidelity gap to close here while
> the legacy compatibility ladder is out of scope.

Follow-up to `legacy-migration-5-0-uuid-default` (PR #3524), which ported only
the PostgreSQL uuid primary-key implicit default branch of
`ActiveRecord::Migration::Compatibility::V5_0`. The TS `V5_0` class in
`packages/activerecord/src/migration.ts` faithfully mirrors the uuid branch
(`compatibility.rb` uuid → `uuid_generate_v4()`) but leaves the rest of the
5.0 compatibility surface unimplemented. Code review on #3524 flagged the gaps;
they are deliberately deferred here to keep that PR scoped.

Rails source (`activerecord/lib/active_record/migration/compatibility.rb`):

- `V5_0.create_table` (compatibility.rb:371–387): besides the uuid branch, also
  sets `default: nil` for integer/bigint PKs (unless MySQL/Trilogy + bigint) and
  defaults `id: :integer` when no `:id` key is given. TS `V5_0.createTable`
  currently falls through to `super` for these.
- `V5_0` inner `TableDefinition` mixin + sibling overrides
  (compatibility.rb:348–362, 393–415): `primary_key` (coerce `:primary_key` →
  `:integer`), `references`/`belongs_to` (force `type: :integer`),
  `create_join_table`, `add_column`, `add_reference`/`add_belongs_to`.
- Ancestry: Rails defines `V5_0 < V5_1` (compatibility.rb:347). The TS class
  extends `Current` as a stand-in because the V5_1..V7_x chain does not exist
  yet. When the intermediate versions are built, re-parent V5_0 onto V5_1.

## Acceptance criteria

- [ ] `V5_0.createTable` integer/bigint PK `default: nil` + `id: :integer`
      default semantics implemented and tested.
- [ ] `V5_0` legacy `primary_key`/`references`/`belongs_to`/`create_join_table`/
      `add_column`/`add_reference` overrides implemented and tested (or any
      that remain out of reach split into their own stories with cited reasons).
- [ ] Re-parent `V5_0` onto `V5_1` once the version chain exists (may be its own
      story if the chain is built separately).
