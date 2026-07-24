---
title: "composite-qualified-col-associated-table-needs-join-dependency-fallback"
status: claimed
updated: 2026-07-24
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-24T00:57:11Z"
assignee: "composite-qualified-col-associated-table-needs-join-dependency-fallback"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of #5186
(`composite-qualified-cols-bind-through-base-table-type`), which made
`PredicateBuilder#buildComposite`
(`packages/activerecord/src/relation/predicate-builder.ts:458-466`) re-root a
qualified col on `this.table.associatedTable(tableName)` so the attribute and
the bind's type both come from the joined table.

That `associatedTable` call passes **no fallback**, unlike
`resolveArelAttribute` (same file, ~line 542), which passes one — Rails'
`lookup_table_klass_from_join_dependencies`
(`predicate_builder.rb:71-73`, threaded from
`relation/query_methods.rb`'s `build_where_clause` block).

Consequence: a qualified col naming a table that exists only as a manual join
(`.joins("...")`, an alias, a join-dependency-resolved name) rather than a
direct reflection falls through `TableMetadata#associatedTable`
(`packages/activerecord/src/table-metadata.ts:46-87`) to the last branch — a
bare `Table` with a generic `TypeCasterConnection` and `klass === null`. The
bind is then typed by the generic caster instead of the joined model's column
type, and `hasColumn` / further association traversal off that metadata
resolves nothing.

Currently unreachable from in-tree callers: both `base.ts` (~4028) and
`associations/disable-joins-association-scope.ts:281` only pass unqualified
`keyCols`. It is reachable from the public
`Relation#where(cols, tuples)` surface, which accepts arbitrary strings.

Threading a resolver in is not a one-liner: `buildComposite` receives no
join-dependency context, so the fallback has to be plumbed from the
`build_where_clause` call site the way Rails threads its block.

## Acceptance criteria

- [ ] `buildComposite`'s qualified-col resolution passes a
      join-dependency fallback to `associatedTable`, matching
      `resolveArelAttribute` / Rails `predicate_builder.rb:71-73` — or the
      limitation is deliberately closed out with the Rails citation showing
      why the fallback cannot reach this path.
- [ ] Regression test: `where(cols, tuples)` with a qualified col naming a
      join-only table binds through that table's model type, not the
      generic `TypeCasterConnection`. Must fail on baseline.
- [ ] The other fallback-less `associatedTable` call sites in
      `predicate-builder.ts` are audited in the same pass and either fixed
      or justified at the call site.
- [ ] No test renames; api:compare / test:compare delta non-negative.
