---
title: "Resolve a namespace's table-name prefix/suffix through module_parents, not a string registry"
status: ready
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`.
Rails resolves a namespaced model's table-name prefix/suffix by walking its
enclosing modules:

```ruby
def full_table_name_prefix # :nodoc:
  (module_parents.detect { |p| p.respond_to?(:table_name_prefix) } || self).table_name_prefix
end
```

(`activerecord/lib/active_record/model_schema.rb:302-308`), with
`Module#module_parents` from `activesupport/lib/active_support/core_ext/module/introspection.rb:53-64`.

trails has no module objects for a `moduleName` string, so `inheritance.ts`
keeps a string registry: `moduleParentChain` (a `string[]` prefix builder, not
`module_parents`), `registerModuleTableNamePrefix` /
`registerModuleTableNameSuffix` (written by
`test-helpers/models/company-in-module.ts`) and `lookupModuleTableNamePrefix`
/ `lookupModuleTableNameSuffix` (read by `model-schema.ts`). All five carry
`@noRailsEquivalent CONVERGEABLE` against this story.

## Acceptance criteria

- A namespace is a real object answering `tableNamePrefix` /
  `tableNameSuffix` (the `defineModule` / `Module` surface activesupport
  already exports), and `fullTableNamePrefix` / `fullTableNameSuffix` port
  `module_parents.detect { ... }` against it.
- The five registry functions are deleted.
