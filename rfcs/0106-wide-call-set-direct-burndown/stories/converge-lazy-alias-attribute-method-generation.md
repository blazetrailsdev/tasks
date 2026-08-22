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

## Also blocked on this: `generate_alias_attribute_methods`' pattern loop

Reviewer finding on PR #6838: `packages/activerecord/src/attribute-methods.ts`
does not mirror `generate_alias_attribute_methods`
(`attribute_methods.rb:80-85`) — it calls one custom descriptor helper instead
of looping every `attribute_method_patterns` entry, and never clears
`attribute_method_patterns_cache`.

That cannot be fixed independently of the eager/lazy flip above. Porting the
loop faithfully means routing each pattern through
`define_attribute_method_pattern(pattern, old_name, owner:, as: new_name,
override: true)` — which is what ActiveModel's own
`aliasAttributeMethodDefinition` already does
(`packages/activemodel/src/attribute-methods.ts:354-366`). Doing that in
ActiveRecord generates every alias **twice**, because ActiveModel's EAGER
`eagerlyGenerateAliasAttributeMethods` still runs at `alias_attribute` time:
trails never assigns ActiveRecord's no-op override
(`attribute-methods.ts:309`, Rails `attribute_methods.rb:76-78`) onto `Base`,
so `alias_attribute` reaches ActiveModel's arm. Measured on
`attribute-methods.trails.test.ts > generates once when the schema load drives
generation first`: `id|id_value` is emitted by both
`activemodel/attribute-methods.ts:340` and the ActiveRecord pass.

Wiring the override (making AR aliases lazy, as Rails has them) is the fix, and
it is this story. It additionally moves two behaviours that trails tests
currently pin to declaration time:

- `attribute-methods.trails.test.ts > aliasing an attribute onto an Active
Record method raises DangerousAttributeError` — in Rails that raise comes
  from `instance_method_already_implemented?` during
  `define_attribute_methods` (`attribute_methods.rb:165-179`), not from
  `alias_attribute`.
- `attribute-methods.trails.test.ts > an inherited generated attribute method
does not suppress the subclass's own generation`.

Both need re-basing onto the lazy timing as part of this work.

### Additional acceptance criteria

- [ ] `generateAliasAttributeMethods` loops `attributeMethodPatterns` and
      clears `attributeMethodPatternsCache()`, mirroring
      `attribute_methods.rb:80-85`.
- [ ] `aliasAttributeMethodDefinition` takes `(codeGenerator, pattern,
newName, oldName)` and routes through `defineAttributeMethodPattern`
      with `override: true`, mirroring `attribute_methods.rb:87-96`.
- [ ] No alias is generated twice (the `generates once when the schema load
drives generation first` invariant holds).

## Resolution (PR #6838)

The lazy flip and the `generate_alias_attribute_methods` pattern loop **landed
in #6838**, not here:

- `eagerly_generate_alias_attribute_methods` is now Rails' empty override
  (`attribute_methods.rb:76-78`) and is wired onto `Base`, so ActiveModel's
  eager arm no longer runs for Active Record and the AR pass is an alias' only
  generator.
- `generate_alias_attribute_methods` loops `attribute_method_patterns` and
  clears `attribute_method_patterns_cache` (`:80-85`).
- `alias_attribute_method_definition` routes through
  `define_attribute_method_pattern(pattern, old_name, owner:, as: new_name,
override: true)` (`:87-96`).
- The two trails tests that pinned the eager timing were re-based onto the lazy
  one.

**The `has_attribute?` guard remains unported, and is now understood to be
language-forced rather than pending work** — so this story does not carry it.

Ruby defers generation to the first call via `method_missing`, so a model that
is only introspected never reaches `alias_attribute_method_definition`. That is
why `vendor/rails/activerecord/test/cases/attributes_test.rb:54` can
`alias_attribute :overloaded_float, :x` against a column `overloaded_types`
does not have (`schema.rb:1408-1415`), call only `type_for_attribute`, and
pass. A JS property must exist before it is read, so trails generates at the
end of every schema load (`defineAttributeMethodsAfterLoad`,
`model-schema.ts:1159`, tagged `@noRailsEquivalent` against CLAUDE.md's
"Generated attribute readers are properties"). `type_for_attribute` loads the
schema, so trails reaches the method there and the guard raises on a Rails test
Rails passes — verified by porting it.

The omission is documented at the call site and carries a reviewed row in
`call-mismatches-exclude/activerecord/attribute-methods.json`. Nothing further
is actionable unless the property-generation rule itself changes.
