---
title: "sweep-references-call-sites-onto-the-colon-symbol-spelling"
status: closed
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
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
closed-reason: "Duplicate: the converge-includes-preload-colon-sweep-* cluster stories already scope references call sites alongside includes/preload/eagerLoad. The one finding it carried that they do not — referencesEagerLoadedTables needing Rails' map(&:to_s) — is refiled as converge-references-eager-loaded-tables-symbol-to-s."
---

## Context

`sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling` deliberately
left `references` alone. Rails' `references(:posts)` takes Symbols
(`query_methods.rb:355-363`) and `references_values` therefore holds Symbols;
`Relation#references_eager_loaded_tables?` reads them back with
`references_values.map(&:to_s)` (`relation.rb:1486`). trails' port
(`relation.ts:1257`) spells that `String(ref)`, which would keep a leading colon
rather than dropping it, so sweeping the call sites without converging that line
would silently break eager-load promotion.

The complication the sweep punted on: a `references` argument that names a TABLE
(a raw string Rails also accepts, and what `referencesFromConditions` /
`columnReferences` in `relation/query-methods.ts` auto-derive) must stay a plain
String, while an argument naming an association takes the colon. Most trails
call sites are ambiguous by inspection because the two spellings coincide
(`references("posts")`).

## Acceptance criteria

- [ ] `referencesEagerLoadedTables` implements Rails' `map(&:to_s)` — a Symbol
      value drops its leading colon there rather than at a new normalization site.
- [ ] `references` call sites in `packages/activerecord/src` that name an
      ASSOCIATION pass the colon spelling; ones that name a table stay Strings,
      matched against the Rails test they mirror.
- [ ] Generated SQL unchanged on all three adapters; no test name touched.
- [ ] `parity:api:calls` / `:args` clean.
