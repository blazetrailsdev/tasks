---
title: "codegen-unmasked-port-divergences"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Invalid premise: prism-codegen was retired in #6168 — scripts/prism-codegen/, convergence-baseline.json and 'pnpm codegen:score' no longer exist, so there is no baseline to burn down. The flagship example converged anyway: includes! is now 'this.includesValues = unionAppend(this.includesValues, associations)' with the includesAssociations accessor and unionAppendAssociations gone; unionAppend is a private local spelling of Ruby's Array#| and is not exported surface."
---

# 23 port divergences unmasked by the codegen operator-longtail images

## Context

PR #6105 (`operator-longtail-images`, RFC 0086) gave prism-codegen JS images for
the operator longtail — `|=` / `&=` via `union` / `intersection`, `<=>` via
`cmp`, multi-arg index via `idxGet` / `idxSet`. Defs that previously _declined_
on those operators were tainted and therefore excluded from the scorer's
denominator; they now generate clean images and get scored, and 24 of them come
out `divergent`/`missing` against the port. One (`findNthWithLimit`) was a
spelling artifact of the `idxGet` image and is signed off with a reason in
`convergence-signoff.json`; the other **23** are this burndown.

**None of these are new port divergences** — none of the ported methods changed
in #6105. They are pre-existing trails-vs-Rails divergences the decline was
hiding. They were reseeded into `scripts/prism-codegen/convergence-baseline.json`
in that PR (regeneration, not ratification) and this story is the burndown.

The clearest example, `QueryMethods#includes!`
(vendor/rails/activerecord/lib/active_record/relation/query_methods.rb):

```ruby
def includes!(*args)
  self.includes_values |= args
  self
end
```

- generated image: `this.includesValues = union(this.includesValues, args)`
- port skeleton: `ref:unionAppendAssociations ref:includesAssociations`

The port routes through a trails-invented `unionAppendAssociations` over an
`includesAssociations` accessor rather than Rails' `includes_values |= args`.
The whole `*_values |= args` family (`eager_load!`, `preload!`, `joins!`,
`left_outer_joins!`, `references!`, `optimizer_hints!`, `with!`,
`with_recursive!`, `_select!`, `and!`, `or!`, `excluding!`, `order!`) diverges
the same way, so this is likely one convergence with many call sites.

## Skeletons

Regenerate at any time with `pnpm codegen:score --guard --verbose`. Captured at
the time of filing:

```text
  persistence.rb :: _deleteRecord
    gen:  ref:map ref:idxGet ref:predicateBuilder ref:buildDefaultConstraint if ref:push if ref:globalCurrentScope ref:push ref:ast ref:whereClause new:DeleteManager ref:DeleteManager ref:table ref:wheres ref:withConnection ref:delete
    port: ref:table new:DeleteManager ref:from loop ref:entries ref:where ref:eq ref:get ref:applyDefaultAndGlobalConstraints ref:threadedConnectionFor ref:constructor if ref:connection if ref:delete ref:delete ref:toSql ref:executeMutation
  persistence.rb :: _updateRecord
    gen:  ref:attributesForUpdate if ref:length ref:trigger_update_callback ref:updateRow ref:trigger_update_callback ref:previously_new_record if ref:block
    port: ref:entries if ref:length ref:table new:UpdateManager ref:table ref:set ref:map ref:get loop ref:entries ref:where ref:eq ref:get ref:applyDefaultAndGlobalConstraints ref:threadedConnectionFor ref:constructor if ref:connection if ref:update ref:update ref:toSql ref:executeMutation
  relation.rb :: joinedIncludesValues
    gen:  ref:intersection ref:includesValues ref:joinsValues
    port: if ref:length ref:joinClauses ref:filter ref:includesAssociations if ref:some ref:joinClauses ref:table
  relation/finder_methods.rb :: findNthWithLimit
    gen:  if ref:loaded ref:idxGet ref:records if ref:orderedRelation if ref:limitValue ref:min ref:limitValue if if ref:zero ref:offset ref:offsetValue if ref:toArray ref:limit
    port: if ref:loaded ref:slice ref:records if ref:orderedRelation if ref:limitValue ref:min ref:limitValue if if ref:offset ref:offsetValue if ref:toArray ref:limit
  relation/query_methods.rb :: _selectBang
    gen:  ref:selectValues ref:union ref:selectValues
    port: ref:flat ref:map if ref:Node if if if if if new:SqlLiteral ref:SqlLiteral ref:value ref:String if ref:selectColumns ref:selectColumns new:Set new:Map ref:hash ref:get if ref:some ref:eql ref:hash ref:get if ref:push ref:set new:Set loop ref:selectColumns if ref:add if ref:add ref:symbolToName if ref:Node ref:addNodeToSeen if ref:add ref:add ref:value loop if if if ref:symbolToName if ref:has ref:push ref:selectColumns ref:add if ref:Node if ref:nodeIsDuplicate ref:push ref:selectColumns ref:addNodeToSeen if if ref:has ref:push ref:selectColumns ref:add ref:value if ref:has ref:push ref:selectColumns ref:add
  relation/query_methods.rb :: andBang
    gen:  ref:structurallyIncompatibleValuesFor if ref:length throw new:ArgumentError ref:whereClause ref:union ref:whereClause ref:whereClause ref:havingClause ref:union ref:havingClause ref:havingClause ref:referencesValues ref:union ref:referencesValues ref:referencesValues
    port: ref:assertRelationForCombining ref:assertStructurallyCompatible ref:whereClause ref:union ref:whereClause ref:whereClause ref:havingClause ref:union ref:havingClause ref:havingClause new:Set ref:referencesValues ref:unionStrings ref:referencesValues ref:referencesValues ref:manualReferences ref:unionStrings ref:manualReferences ref:manualReferences if
  relation/query_methods.rb :: arelColumnWithTable
    gen:  ref:referencesValues ref:union ref:referencesValues ref:sql if if ref:match ref:resolveArelAttribute ref:predicateBuilder ref:lookupTableKlassFromJoinDependencies ref:sql ref:quoteTableName ref:adapterClass ref:model
    port: ref:referencesValues if if ref:includes ref:referencesValues if ref:symbolToName ref:model if ref:includes ref:safeQuoteTableName ref:safeQuoteColumnName ref:arelSql if if ref:test ref:predicateBuilder ref:lookupTableKlassFromJoinDependencies ref:resolveArelAttribute if ref:get new:ArelTable ref:safeQuoteTableName ref:arelSql
  relation/query_methods.rb :: buildJoinDependencies
    gen:  ref:union ref:joinsValues ref:leftOuterJoinsValues if ref:length ref:eagerLoadValues ref:union ref:eagerLoadValues if ref:length ref:includesValues ref:union ref:includesValues ref:unshift ref:constructJoinDependency ref:selectNamedJoins
    port: loop if ref:includes ref:push ref:addNames ref:filter ref:joinsValues ref:namedJoinValue ref:addNames ref:leftOuterJoinsValues ref:addNames ref:eagerLoadAssociations ref:addNames ref:includesAssociations ref:selectNamedJoins ref:constructJoinDependency ref:unshift
  associations.rb :: eagerLoadBang
    gen:  ref:eagerLoadBang ref:eagerLoadBang
    port:
  relation/query_methods.rb :: excludingBang
    gen:  ref:invert ref:idxGet ref:predicateBuilder ref:primaryKey ref:model ref:whereClause new:WhereClause ref:WhereClause
    port: ref:primaryKey if ref:array throw new:Error ref:filter ref:relationLike ref:filter ref:relationLike if ref:length ref:push ref:predicates ref:whereClause ref:invert ref:build ref:predicateBuilder ref:get ref:table ref:table ref:predicateBuilder ref:get ref:table ref:table ref:predicateBuilder ref:map if ref:baseInstance ref:id ref:right ref:build ref:predicateBuilder ref:first ref:push ref:predicates ref:whereClause new:DeferredIdsNotIn
  relation/query_methods.rb :: includesBang
    gen:  ref:includesValues ref:union ref:includesValues
    port: ref:unionAppendAssociations ref:includesAssociations
  relation/query_methods.rb :: joinsBang
    gen:  ref:joinsValues ref:union ref:joinsValues
    port: loop if ref:some ref:joinsValues ref:structuralUnionEq ref:push ref:joinsValues
  relation/query_methods.rb :: leftOuterJoinsBang
    gen:  ref:leftOuterJoinsValues ref:union ref:leftOuterJoinsValues
    port: loop if ref:some ref:leftOuterJoinsValues ref:structuralUnionEq ref:push ref:leftOuterJoinsValues
  relation/query_methods.rb :: optimizerHintsBang
    gen:  ref:optimizerHintsValues ref:union ref:optimizerHintsValues
    port: ref:push ref:optimizerHints
  relation/query_methods.rb :: orBang
    gen:  ref:structurallyIncompatibleValuesFor if ref:length throw new:ArgumentError ref:whereClause ref:or ref:whereClause ref:whereClause ref:havingClause ref:or ref:havingClause ref:havingClause ref:referencesValues ref:union ref:referencesValues ref:referencesValues
    port: ref:assertRelationForCombining ref:assertStructurallyCompatible ref:whereClause ref:or ref:whereClause ref:whereClause ref:havingClause ref:or ref:havingClause ref:havingClause new:Set ref:referencesValues ref:unionStrings ref:referencesValues ref:referencesValues ref:manualReferences ref:unionStrings ref:manualReferences ref:manualReferences if
  relation/query_methods.rb :: orderBang
    gen:  if ref:length ref:preprocessOrderArgs ref:orderValues ref:union ref:orderValues
    port: if ref:length ref:preprocessOrderArgs ref:orderClauses ref:dedupeOrderClauses ref:orderClauses
  relation/query_methods.rb :: preloadBang
    gen:  ref:preloadValues ref:union ref:preloadValues
    port: ref:unionAppendAssociations ref:preloadAssociations
  relation/query_methods.rb :: preprocessOrderArgs
    gen:  ref:disallowRawSqlBang ref:model ref:flattenedArgs ref:columnNameWithOrderMatcher ref:adapterClass ref:model ref:validateOrderArgs ref:columnReferences if ref:length ref:referencesValues ref:union ref:referencesValues ref:flattenBang ref:mapBang if ref:caseEq ref:asc ref:orderColumn ref:String if ref:caseEq ref:map if ref:map ref:publicSend ref:orderColumn ref:join ref:String ref:String ref:downcase if ref:caseEq ref:SqlLiteral ref:Nodes if ref:caseEq ref:Node ref:Nodes if ref:caseEq ref:Attribute ref:publicSend ref:downcase ref:publicSend ref:orderColumn ref:String ref:downcase
    port: ref:map ref:flattenedOrderKeysForRawSqlCheck if ref:symbolToName ref:disallowRawSqlBang ref:resolveOrderMatcher ref:model ref:validateOrderArgs ref:columnReferences if ref:length ref:referencesValues if ref:referencesValues new:Set loop if ref:push new:Ascending ref:Ascending ref:orderColumn ref:symbolToName if loop ref:push if ref:Node ref:orderedNode ref:orderedNode ref:orderColumn ref:String if ref:plainObject loop ref:ownKeys if ref:symbolToName ref:get if ref:plainObject loop ref:entries ref:push ref:orderedNode ref:orderColumn ref:join ref:push ref:orderedNode ref:orderColumn ref:push ref:length ref:push
  relation/query_methods.rb :: referencesBang
    gen:  ref:referencesValues ref:union ref:referencesValues
    port: loop if ref:SqlLiteral ref:value if if ref:includes ref:referencesValues ref:push ref:referencesValues
  relation/query_methods.rb :: withBang
    gen:  ref:processWithArgs ref:withValues ref:union ref:withValues
    port: loop if ref:plainObject if if ref:name ref:constructor if throw ref:argumentError loop ref:entries ref:resolveCteEntry ref:upsertCte ref:ctes
  relation/query_methods.rb :: withRecursiveBang
    gen:  ref:processWithArgs ref:withValues ref:union ref:withValues ref:with_is_recursive
    port: loop if ref:plainObject if if ref:name ref:constructor if throw ref:argumentError loop ref:entries ref:resolveCteEntry ref:upsertCte ref:ctes
```

## Acceptance criteria

- [ ] For each row, decide: converge the port to the Rails body, or catalog the
      deviation with a reviewed reason in the api-compare exclude lists.
      Do NOT close a row by re-reseeding the convergence baseline.
- [ ] Delete each converged/catalogued row from
      `scripts/prism-codegen/convergence-baseline.json` — the guard accepts
      removals, so the baseline shrinks as the burndown proceeds.
- [ ] `pnpm codegen:score --guard` stays green.
- [ ] Likely splits into several PRs (the `*_values |= args` family, the
      `persistence.rb` write path, the `finder_methods.rb` pair). File them as
      separate stories rather than one mega-PR.
