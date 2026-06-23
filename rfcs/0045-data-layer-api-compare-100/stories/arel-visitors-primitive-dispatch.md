---
title: "arel-visitors-primitive-dispatch"
status: draft
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: arel
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Two arel visitor files are below 100%:

- `packages/arel/src/visitors/dot.ts` (41/60, 19 miss): `visit_Arel_Nodes_Regexp`,
  `visit_Arel_Nodes_NotRegexp`, `visit_Arel_Nodes_CurrentRow`,
  `visit_Arel_Nodes_Distinct`, `visit_Arel_Nodes_And`, `visit_Arel_Nodes_Or`,
  `visit_Arel_Nodes_With`, `visit_Arel_Nodes_SqlLiteral`, plus the Ruby
  primitive visitors `visit_Time`, `visit_Date`, `visit_DateTime`,
  `visit_NilClass`, `visit_TrueClass`, `visit_FalseClass`, `visit_Integer`,
  `visit_BigDecimal`, `visit_Float`, `visit_Symbol`, `visit_Set`.
- `packages/arel/src/visitors/to-sql.ts` (119/135, 16 miss): `visit_Arel_Nodes_Quoted`,
  `visit_ActiveSupport_Multibyte_Chars`, `visit_ActiveSupport_StringInquirer`,
  `visit_BigDecimal`, `visit_Class`, `visit_Date`, `visit_DateTime`,
  `visit_FalseClass`, `visit_Float`, `visit_Hash`, `visit_NilClass`,
  `visit_String`, `visit_Symbol`, `visit_Time`, `visit_TrueClass`, `visit_Set`.

In Rails most of these are `alias`es to a shared private visitor, not separate
defs: `vendor/rails/activerecord/lib/arel/visitors/dot.rb:200`
(`alias :visit_Time :visit_String`), `:65-66` (`visit_Arel_Nodes_Regexp` →
`visit__regexp`), `:193-195` (And/Or/With → `visit__children`). A few are real
defs, e.g. `to_sql.rb:824` `def visit_Integer`. The aliased target is generally
already ported; the alias name is what the comparator misses. Some primitive
visitors (`visit_BigDecimal`, `visit_Symbol`, `visit_Set`) have no trails value
pipeline equivalent (no Ruby `BigDecimal`/`Symbol`/`Set`).

## Acceptance criteria

- For each missing `visit_*`: read the Rails dot.rb / to_sql.rb body and the
  corresponding trails visitor. Port the names whose target is reachable in
  trails (or add the alias method delegating to the ported target), with a test
  exercising the dispatch where behavior is observable.
- Ruby-only primitives with no trails equivalent get a `SKIP_GROUPS` entry in
  `scripts/api-compare/conventions.ts` naming them and the reason (e.g. "Ruby
  BigDecimal/Symbol/Set have no trails Arel value-pipeline equivalent").
- `pnpm api:compare --package arel` shows `visitors/dot.ts` and
  `visitors/to-sql.ts` at 100%.
