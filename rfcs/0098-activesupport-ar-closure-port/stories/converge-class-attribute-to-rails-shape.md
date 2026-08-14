---
title: "converge-class-attribute-to-rails-shape"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6520
claim: "2026-08-14T13:27:03Z"
assignee: "converge-class-attribute-to-rails-shape"
blocked-by: null
closed-reason: null
---

## Context

`core_ext/class/attribute.rb` was bucketed onto
`packages/activesupport/src/class-attribute.ts` by the
`core-ext-sweep-hash-module-string-residue` PR (a `RUBY_FILE_TS_OVERRIDES` row
in `scripts/parity/conventions.ts`, next to the existing
`core_ext/module/redefine_method.rb` row). That closed the missing
`class_attribute` member, but it also put the body into the call-parity
population and surfaced three pre-existing divergences, now baselined in
`scripts/api-compare/call-mismatches-exclude/activesupport/class-attribute.json`:

- `redefine` — Rails' `class_attribute` calls
  `::ActiveSupport::ClassAttribute.redefine(self, name, namespaced_name, default)`
  (`vendor/rails/activesupport/lib/active_support/core_ext/class/attribute.rb:97`);
  trails' `classAttribute` writes the default straight into its own
  `CLASS_ATTRS` store (`packages/activesupport/src/class-attribute.ts:68-70`).
- `caller_locations` / `first` — the generated-method-location omission shared
  with `delegate` and `mattr_accessor`.

The body diverges more broadly than those three calls: Rails takes `*attrs`
(varargs) plus `instance_accessor:` / `instance_reader:` / `instance_writer:` /
`instance_predicate:` / `default:`, raises `TypeError` on a non-Symbol/String
name, namespaces the storage as `__class_attr_#{name}`, and defines a `#{name}?`
predicate; trails takes a single `name`, defaults `instancePredicate` to
`false`, and spells the predicate `isName`.

## Acceptance criteria

- [ ] `classAttribute` mirrors `class_attribute`'s parameter list, defaults and
      branch order, including the varargs `attrs` arm and the `TypeError`.
- [ ] The default is written through `ClassAttribute.redefine`, and the
      `__class_attr_` namespaced name is used for storage.
- [ ] The `redefine` row is deleted from
      `call-mismatches-exclude/activesupport/class-attribute.json` and the
      resulting stale high-water mark tightened with
      `pnpm parity:api:calls:tighten activesupport/class-attribute.json`.
- [ ] `core-ext/class/attribute.test.ts` carries the Rails test names from
      `vendor/rails/activesupport/test/core_ext/class/attribute_test.rb`.
