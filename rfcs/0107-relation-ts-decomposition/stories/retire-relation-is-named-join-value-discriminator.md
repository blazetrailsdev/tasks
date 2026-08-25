---
title: "retire-relation-is-named-join-value-discriminator"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps:
  - sweep-joins-call-sites-onto-the-colon-symbol-spelling
deps-rfc: []
est-loc: 150
priority: null
pr: 6711
claim: "2026-08-18T18:27:43Z"
assignee: "retire-relation-is-named-join-value-discriminator"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `retire-relation-parallel-join-resolver` (PR that deleted
`_resolveAssociationJoin` / `_resolveThroughJoin` / `_resolveHabtmJoin` /
`_deriveForeignKey` / `_appendAssociationScope` / `_resolveAssocTables` /
`_resolveHasManyJoin` / `_resolveHasManySubquery`, ~534 lines, by converging
`Relation#referencesEagerLoadedTables` onto Rails' `build_joins([])`
(`relation.rb:1474-1489`)).

Two members of that cluster survive because they have external readers and no
one-to-one Rails counterpart:

- `_isNamedJoinValue` (`relation.ts`, ~10 lines after the resolver deletion)
- `_isAssociationName` (`relation.ts`, ~5 lines)

Readers:

- `relation/query-methods.ts:2781` — inside `selectInnerNamedJoins`
- `relation/query-methods.ts:2916` — inside `buildJoinBuckets`, deciding
  whether a String joins_value becomes an `Arel::Nodes::StringJoin`
  (`query_methods.rb:1851-1853`)
- `relation/merger.ts:167`
- `associations/association-scope.ts:1001`

Rails does not make this test at all: in Ruby a Symbol joins_value IS an
association name and a String joins_value IS raw SQL, so
`query_methods.rb:1851` is a bare `String === join`. trails collapses Ruby
Symbol and String onto one JS string, so the discriminator has to come from
somewhere — and `_isNamedJoinValue` is the invented somewhere.

CLAUDE.md already prescribes the settled idiom for exactly this: a Ruby Symbol
value is spelled as a colon-prefixed string (`":posts"`), and the leading colon
is the discriminator Ruby gets from the type. `relation/symbol-association-join-spec.trails.test.ts`
shows the colon form already flows through `joins`.

## Acceptance criteria

- The Symbol-vs-String discrimination in `buildJoinBuckets` /
  `selectInnerNamedJoins` reads the Rails discriminator (Symbol-ness), not a
  model-association lookup, so it matches `query_methods.rb:1851-1853`.
- `_isNamedJoinValue` and `_isAssociationName` are deleted from `relation.ts`,
  and the four external readers above are rewritten against the Rails-named
  surface, not re-pointed at a renamed helper.
- Generated SQL for `joins`, through-associations, HABTM, polymorphic and STI
  targets is unchanged on all three adapters.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
