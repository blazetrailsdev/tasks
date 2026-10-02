---
title: "activerecord: a model's namespace is its constant path, not a moduleName static"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and them are re-tagged `CONVERGEABLE` onto this story.

Rails reads a model's namespace off the class itself. `sti_name` and `polymorphic_name`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:187-189,211-213`) read `name`, which is the full constant path
(`Admin::User`), and `full_table_name_prefix` / `full_table_name_suffix`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:302-308`) call `module_parents` on `self` with no argument:

```ruby
def full_table_name_prefix # :nodoc:
  (module_parents.detect { |p| p.respond_to?(:table_name_prefix) } || self).table_name_prefix
end
```

trails models are flat JS classes whose `name` is the unqualified leaf, so the namespace is carried
in an invented `moduleName` static and rebuilt at each reader:

- `qualifiedName(modelClass)` and `namespaceSegments(modelClass)` in
  `packages/activerecord/src/inheritance.ts` (`@noRailsEquivalent`), read by `stiName` and
  `polymorphicName` there and by `associations.ts`, `base.ts` and `model-schema.ts`.
- `fullTableNamePrefix` / `fullTableNameSuffix` in `packages/activerecord/src/model-schema.ts` call
  `moduleParents({ name: qualifiedName(this) })`, an argument Rails does not pass
  (`@missingRailsArgs module_parents`).

trails#8313 made `rbModConstSet` path a class and added `rbModName` (`rb_mod_name`,
`vendor/ruby/v3.3.11/variable.c:122-127`). A model seated through it has its Rails name.

Related: `activerecord-rails-class-name-statics-onto-rb-mod-name` (the framework classes'
`_railsClassName`), `core-inspect-namespaced-qualified-class-name` (the record `inspect` half),
`model-class-names-resolve-through-constantize-not-a-model-registry` (the registry this static feeds).

## Acceptance criteria

- [ ] A namespaced model's name is read through `rbModName(klass)`; `moduleName`, `_demodulizedName`, `qualifiedName` and `namespaceSegments` are deleted.
- [ ] `fullTableNamePrefix` / `fullTableNameSuffix` call `moduleParents` on the class with no synthesized `{ name }` argument, and both `@missingRailsArgs module_parents` receipts are deleted.
- [ ] `pnpm parity:api:extra:gate`, `pnpm parity:api:calls:args` and `pnpm parity:api:receipts:gate` stay green.
