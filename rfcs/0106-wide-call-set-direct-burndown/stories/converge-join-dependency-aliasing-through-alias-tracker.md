---
title: "Route JoinDependency#makeConstraints alias resolution through AliasTracker#aliasedTableFor"
status: done
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6751
claim: "2026-08-19T23:31:49Z"
assignee: "converge-join-dependency-aliasing-through-alias-tracker"
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency#make_constraints` builds each join's ON clause against the table
that `alias_tracker.aliased_table_for` picks:

- `activerecord/lib/active_record/associations/join_dependency.rb:190-212`
  — `table = alias_tracker.aliased_table_for(reflection.klass.arel_table,
table_name) { name = reflection.alias_candidate(parent.table_name); root ?
name : "#{name}_join" }`, with the `@joined_tables[remaining_reflection_chain]`
  memo and the `join_type == Arel::Nodes::OuterJoin` guard around it.
- `activerecord/lib/active_record/associations/alias_tracker.rb:58-75`
  — `aliased_table_for(arel_table, table_name = nil)`, the block supplying the
  alias candidate only when a collision forces one.

trails' `packages/activerecord/src/associations/join-dependency.ts` never calls
`AliasTracker#aliasedTableFor` (which is ported and is used elsewhere). It
resolves aliases through its own emit-time path — `_resolveChildAlias`,
`_claimNodeTable`, `_rebuildChildJoin`, plus direct
`this._aliasTracker.aliases.set(...)` bumps — leaving one open row:

    associations/join-dependency.json  make_constraints -> aliased_table_for

This is a real fidelity gap, not noise: Rails names the helper and trails
reimplements its collision/candidate logic inline. It was scoped out of
`wave-4d-associations-residue-part-4` (PR 6739) because converging it is a
refactor of the whole emit-time aliasing path rather than a call-site fix.

The converged shape routes every alias decision in `makeConstraints` through
`aliasTracker.aliasedTableFor(reflection.klass.arelTable, tableName, () => ...)`
with Rails' candidate block, and deletes the bespoke resolution helpers that
duplicate it.

## Acceptance criteria

- [ ] `makeConstraints` obtains each join table from
      `aliasTracker.aliasedTableFor` with Rails' arguments and candidate block.
- [ ] The bespoke `_resolveChildAlias` / `_claimNodeTable` alias-minting logic
      that duplicates `aliasedTableFor` is removed, not left alongside it.
- [ ] The `@joined_tables` memo and the `OuterJoin` guard keep Rails' shape and
      branch order.
- [ ] The `make_constraints -> aliased_table_for` row is converged (deleted by
      hand via `serializeBaseline`) and the shard's mark tightened. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; `pnpm parity:api:extra --package
activerecord` shows no new novel surface.
- [ ] The join-dependency alias suites stay green — `join-dependency-alias-tracker`,
      `join-dependency-alias-length.trails`, `join-dependency-through-aliasing`,
      `join-dependency-belongs-to-dedup`, `join-dependency-duplicate-objects`,
      `inner-join-association`, `left-outer-join-association`, `eager` — on
      SQLite, PostgreSQL and MySQL/MariaDB.
