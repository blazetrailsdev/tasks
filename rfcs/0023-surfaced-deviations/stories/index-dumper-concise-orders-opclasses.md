---
title: "SchemaDumper: collapse index orders/opclasses via concise_options (lengths-only today)"
status: claimed
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 50
pr: null
claim: "2026-06-17T02:31:24Z"
assignee: "index-dumper-concise-orders-opclasses"
blocked-by: null
---

## Context

PR #3432 ported `concise_options` collapse for index prefix **lengths** only
(`conciseIndexLengths` in `packages/activerecord/src/schema-dumper.ts`, applied
in `indexParts`). Rails `IndexDefinition#concise_options`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:30-32,65-71`)
collapses **lengths, orders, AND opclasses** at IndexDefinition construction:
when every column carries the option and all values are identical, the
per-column map collapses to a single scalar.

The trails dumper still emits expanded maps for `orders`/`opclasses` when all
columns share a value (e.g. `order: { name: "desc", rating: "desc" }` instead
of `order: :desc`). A related pre-existing quirk: the in-memory MigrationContext
dump path stores raw `orders` and an existing test
(`schema dumps index sort order`) asserts the **expanded** single-column form
`order: { name: "desc" }`, which is itself non-Rails-faithful (Rails would
collapse a single-column order to `order: :desc`).

## Acceptance criteria

- [ ] `conciseIndexLengths` generalized (or a shared `conciseOptions` helper) so
      `orders` and `opclasses` collapse to a scalar when all columns share one
      value, matching Rails `concise_options`.
- [ ] Applied uniformly across both the adapter dump path and the in-memory
      MigrationContext sync dump path (mirror the `lengths` approach in
      `indexParts`).
- [ ] Reconcile the `schema dumps index sort order` expectation with Rails
      (single-column `order: :desc` collapse) — read the Rails test first; fix
      the implementation/expectation to match Rails rather than renaming.
- [ ] No gate-mismatches; verify on mysql + postgres (orders/opclasses are
      PG-relevant) + sqlite.

Rails source: `activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb`
(`concise_options`), `activerecord/lib/active_record/schema_dumper.rb#index_parts`.
