---
title: "arel-aliased-join-tables-should-be-tablealias"
status: blocked
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-15T18:41:12Z"
assignee: "arel-aliased-join-tables-should-be-tablealias"
blocked-by: "Depends on PR #4889 (arel-join-tables-lack-type-casters), still OPEN and unmerged. Every acceptance criterion targets symbols that exist only on that branch: aliasedArelTableFor / aliasedArelTableForReflection (associations/alias-tracker.ts) do not exist on origin/main, and Table#typeCaster is already private there (main table.ts:36), so 'can go back to private' is a no-op. Doing this work now would require branching from #4889 = a stacked PR, which CLAUDE.md forbids. Re-ready this story once #4889 merges."
closed-reason: null
---

## Context

Surfaced in review of #4889 (`arel-join-tables-lack-type-casters`).

Rails encodes an aliased table as `Arel::Nodes::TableAlias` — `aliased_table_for`
calls `arel_table.alias(name)` (`alias_tracker.rb:64,74`) and the node delegates
`type_for_attribute` to the underlying real table (`table_alias.rb:22-24`).

trails instead encodes an aliased join table as `Table(realName, { as: alias })`.
PR #4889 had to carry the type caster across that encoding by hand
(`aliasedArelTableFor`, `associations/alias-tracker.ts`) precisely because the
`TableAlias` node could not be returned from those sites.

trails already HAS the faithful node with the faithful delegation
(`packages/arel/src/nodes/table-alias.ts:41-44`), and `TableMetadata#associatedTable`
already uses `.alias()` (`table-metadata.ts:83`, mirroring `table_metadata.rb:44`).
So this is an encoding convergence, not a missing port.

## Why it was not done in #4889 (measured)

Swapping `aliasedArelTableFor` to `klass.arelTable.alias(name)` fails 3 tests:

- `join-dependency-walk.test.ts` > "rebinds ON predicates to merged parent alias
  when table names collide"
- `join-dependency-through-aliasing.test.ts` > "uses the Rails alias_candidate
  when the target real name collides"
- `join-dependency-through-aliasing.test.ts` > "aliases a referenced
  through-target table to the reference name when free"

Root cause: `TableAlias` is a `Binary` node, NOT a `Table`, so the JoinDependency
plumbing silently stops matching. `rebindTableReferences` gates on
`rel instanceof Table` (`join-dependency.ts:1779`) and drops every rebind.
Also `TableAlias#name` is the ALIAS while `Table#name` is the REAL table, so
`.tableAlias ?? .name` readers change meaning.

Scope in `packages/activerecord/src` (non-test): 4 `instanceof Table` gates,
~26 `: Table` / `as Table` annotations in `associations/`, 8 `.tableAlias ??`
effective-name reads.

## Acceptance criteria

- [ ] JoinDependency plumbing accepts `Table | TableAlias` (typed + `instanceof`
      gates), reading the effective SQL name and the real table name through one
      helper rather than `.tableAlias ?? .name`.
- [ ] `aliasedArelTableFor` collapses to `klass.arelTable.alias(name)`, matching
      `alias_tracker.rb:64`; the hand-carried `typeCaster`/`klass` copy is gone.
- [ ] `Table#typeCaster` can go back to `private` (only #4889's copy needs it).
- [ ] The 3 tests above stay green. No test name changes.
- [ ] api:compare / test:compare delta non-negative.
