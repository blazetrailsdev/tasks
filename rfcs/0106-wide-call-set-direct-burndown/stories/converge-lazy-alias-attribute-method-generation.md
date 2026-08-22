---
title: "converge-lazy-alias-attribute-method-generation"
status: ready
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
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
closed-reason: null
---

# Make alias-attribute method generation lazy so Rails' `has_attribute?` guard can be ported

## Context

`ActiveRecord::AttributeMethods::ClassMethods#alias_attribute_method_definition`
(`attribute_methods.rb:87-96`) raises ArgumentError when a model aliases a name
that is not an attribute:

    if !abstract_class? && !has_attribute?(old_name)
      raise ArgumentError, "#{self.name} model aliases `#{old_name}`, but ..."

`wave-4c-ar-core-residue-attributes-remainder-part-3` ported that guard and had
to revert it: it raises on code Rails accepts.

The reason is that Rails' guard is **lazy**. `alias_attribute` only records the
alias; the guard runs inside `generate_alias_attributes` →
`generate_alias_attribute_methods` → `alias_attribute_method_definition`, which
Rails reaches from `define_attribute_methods`. `type_for_attribute` never
generates attribute methods, so the guard never runs for a model that is only
introspected.

That is load-bearing for at least two live cases:

- `vendor/rails/activerecord/test/cases/attributes_test.rb:54`
  (`.type_for_attribute supports attribute aliases`) does
  `alias_attribute :overloaded_float, :x` where `x` is **not** a column on
  `overloaded_types` (`vendor/rails/activerecord/test/schema/schema.rb:1408-1415`),
  then only calls `type_for_attribute`. Rails passes; the ported guard raises
  `WithAlias model aliases 'x', but 'x' is not an attribute`.
- `Firm`'s `id_value` → `id` alias (`base.ts:394`) raises under the
  ignored-columns path in `base.trails.test.ts`
  (`a subclass that ignores every column memoizes and serves an empty columns list`).

trails calls `generateAliasAttributes` (`attribute-methods.ts`) eagerly relative
to Rails, so the guard fires against a class whose attribute set is not the one
Rails would be looking at.

## Acceptance criteria

- [ ] Alias-attribute method generation happens where Rails does it — driven by
      `define_attribute_methods`, not eagerly — so a model that is only
      introspected (`type_for_attribute`) never generates them.
- [ ] The `!abstract_class? && !has_attribute?(old_name)` ArgumentError from
      `attribute_methods.rb:90-92` is ported, with Rails' exact message.
- [ ] `attributes_test.rb:54` and the `base.trails.test.ts` ignored-columns case
      both stay green.
- [ ] The `alias_attribute_method_definition -> has_attribute?` row is deleted
      from `scripts/api-compare/call-mismatches-exclude/activerecord/attribute-methods.json`
      by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/attribute-methods.json`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
