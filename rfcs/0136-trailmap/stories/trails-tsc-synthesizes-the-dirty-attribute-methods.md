---
title: "trails-tsc: synthesize the attribute-method family (Was, Changed, …) for columns and aliases"
status: in-progress
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9402
claim: "2026-10-28T14:43:06Z"
assignee: "split-the-render-pages-the-rails-way-story"
blocked-by: null
closed-reason: null
---

## Context

For a column, trails-tsc synthesizes only a getter and a setter (`synthesizeDeclares` / `renderSchemaColumnDeclares` in `packages/activerecord-cli/src/type-virtualization/synthesize.ts`). Since trails#8954, an alias created with `aliasAttribute` gets the same pair and nothing more.

Rails attaches a whole family of methods to every attribute and to every alias. `ActiveModel::Dirty` (activemodel/lib/active_model/dirty.rb) registers them with `attribute_method_suffix` and `attribute_method_affix`, and `alias_attribute` (activemodel/lib/active_model/attribute_methods.rb) aliases the whole family. So under trails-tsc, `record.prNumberWas`, `prNumberChanged()` and similar methods are TS2339 unless someone declares them by hand. Line numbers are not cited because no Rails checkout was at hand when this was filed.

## Acceptance criteria

- For every synthesized attribute (schema column, `this.attribute`, or alias), emit the dirty and query methods the runtime defines (`<name>Was`, `<name>Changed`, `<name>Change`, `<name>BeforeLastSave`, `saved<Name>Change`, `<name>InDatabase`, `restore<Name>Bang`, and so on). Use the method names the trails runtime actually defines, checked against `packages/activemodel/src/dirty.ts`.
- Each one reuses the attribute's reader type, including an enum-narrowed type.
- A member the class already declares wins.
- Add tests in `virtualize.trails.test.ts`.
