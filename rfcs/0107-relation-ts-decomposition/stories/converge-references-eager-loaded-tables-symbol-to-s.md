---
title: "Converge referencesEagerLoadedTables onto Rails' references_values.map(&:to_s)"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6726
claim: "2026-08-18T21:06:56Z"
assignee: "converge-references-eager-loaded-tables-symbol-to-s"
blocked-by: null
closed-reason: null
---

## Context

Blocker for the `references` half of the `converge-includes-preload-colon-sweep-*`
cluster: sweeping a `references` association-name call site onto the colon
spelling breaks eager-load promotion until this converges, so this should land
first.

Rails' `Relation#references_eager_loaded_tables?` reads the values back with
`references_values.map(&:to_s)`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1486`), subtracts the
downcased joined-table list, and promotes `includes` to a JOIN when anything is
left over. `references_values` holds Symbols, because `references!` stores
`*table_names` unconverted (`query_methods.rb:360-363`) and callers pass
`references(:posts)`.

trails ports that line as `String(ref)`
(`packages/activerecord/src/relation.ts:1257`). For a bare string that is
correct, but for the colon spelling `String(":posts")` is `":posts"`, which never
matches a `joined_tables` entry — so a swept `references(":posts")` would report
`true` unconditionally and silently promote every `includes` to an eager JOIN.

`sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling` (PR #6715)
deliberately left `references` untouched for exactly this reason.

## Converged shape

`referencesEagerLoadedTables` implements Ruby's `Symbol#to_s` — a colon-prefixed
value drops its leading colon there, at the `map(&:to_s)` site Rails already has,
rather than at a new normalization site. This is the same convergence
`JoinDependency.walkTree` (`associations/join-dependency.ts:933,952`) and
`Preloader::Branch#_normalizeAssociationName` already made for their own `to_sym`
sites.

Note the auto-derived arm stays a String: `referencesFromConditions` /
`columnReferences` (`relation/query-methods.ts:505,751`) yield table names, which
Rails also produces as Strings (`PredicateBuilder.references`).

## Acceptance criteria

- [ ] `referencesEagerLoadedTables` (`relation.ts:1257`) mirrors
      `references_values.map(&:to_s)`, dropping a leading colon.
- [ ] A regression test covers `references(":posts")` promoting identically to
      `references("posts")` — it must fail on the pre-change baseline.
- [ ] No new normalization site; generated SQL unchanged on all three adapters.
- [ ] `parity:api:calls` / `:args` clean.
