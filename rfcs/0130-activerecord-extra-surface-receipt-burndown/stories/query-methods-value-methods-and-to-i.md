---
title: "Run the value-method loop in QueryMethods' module body and port to_i through ruby-compat"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: trails#8033
claim: "2026-09-24T13:35:28Z"
assignee: "point-value-converges-onto-active-record-point"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`,
which relabelled these two `relation/query-methods.ts` exports from
`@noRailsEquivalent PERMANENT` to `CONVERGEABLE` against this story.

- `defineValueMethods(relationClass)` is the port of the module-body loop
  `Relation::VALUE_METHODS.each do |name| ... class_eval <<-CODE`
  (`activerecord/lib/active_record/relation/query_methods.rb:162-185`), which
  defines `#{name}_values` / `#{name}_value` / `#{name}_clause` and their
  writers on `QueryMethods` itself, plus `alias extensions extending_values`.
  trails runs the loop as a named function that `relation.ts` calls against
  the `Relation` prototype, so the name is extra surface. Converging means
  running the loop in `query-methods.ts`'s module body against the
  `QueryMethods` carrier that `include()` copies onto `Relation` (accessors
  only carry from a class module — see `ruby-compat/src/include.ts`).
- `toI(value)` is a `to_i` dispatch over `nil` / Integer / String, called at
  `querying.ts` `countBySql` (Rails `querying.rb:111`,
  `select_value(...).to_i`) and `buildArel`'s offset
  (`query_methods.rb` `build_cast_value("OFFSET", offset_value.to_i)`).
  ruby-compat already ports `String#to_i` as `rbStrToI`
  (`ruby-compat/src/string/convert.ts`); the receiver dispatch belongs there.

## Acceptance criteria

- The value-method loop runs where Rails runs it, and `defineValueMethods` is
  gone from `relation/query-methods.ts`'s exports.
- `toI` is replaced by the ruby-compat `to_i` port at each call site.
