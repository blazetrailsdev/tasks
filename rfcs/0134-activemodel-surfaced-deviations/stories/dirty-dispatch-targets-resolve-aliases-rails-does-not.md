---
title: "activemodel: every Dirty dispatch target resolves aliases where Rails passes attr_name.to_s raw"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveModel::Dirty` dispatch targets all take the name raw:
`attribute_changed?` / `attribute_was` / `attribute_previously_changed?` /
`attribute_previously_was` / `attribute_changed_in_place?` /
`clear_attribute_change` / `attribute_change` / `attribute_previous_change` /
`attribute_will_change!` / `restore_attribute!` are each `attr_name.to_s` and
nothing more (`vendor/rails/activemodel/lib/active_model/dirty.rb:299-419`).
Alias resolution in Rails happens at method-GENERATION time —
`define_attribute_method_pattern` passes the canonical `attr_name` with
`as: alias` (`attribute_methods.rb:320-348`) — never inside the dispatch
target.

trails adds `(this.constructor as DirtyClass).resolveAttributeName(attrName)`
to all ten (`packages/activemodel/src/dirty.ts:58-171`). Behavior difference:
`record.attributeChanged("someAlias")` is false in Rails (raw-name miss) and
true in trails.

First settle WHY the calls are there: either trails' generation path fails to
bake the canonical name into alias-generated methods (then that is the bug to
fix, in `attribute-methods.ts:208-220` / `defineMethodAttribute`), or the
resolution is invented leniency (then the removal is mechanical). One
comparison run against MRI decides it — `ruby` is on PATH; define an alias,
call both the generated `alias_changed?` and the raw
`attribute_changed?(:alias)` on both sides.

## Acceptance criteria

- All ten dispatch targets in `dirty.ts` spell `attr_name.to_s`'s translation
  (`String(attrName)` at most), matching dirty.rb line for line.
- If the generation path needed the resolution, the fix lands there instead,
  with the Rails `file:line` cited.
- A regression test pinning the raw-name behavior of `attributeChanged` with
  an alias defined, verified against MRI first, failing on the baseline.
