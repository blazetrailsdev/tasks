---
title: "activerecord: define_method on a class receiver goes through a ruby-compat Module#define_method"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and them are re-tagged `CONVERGEABLE` onto this story.

Three bodies define a method on a class at run time with `define_method`
(`rb_mod_define_method`, `vendor/ruby/v3.3.11/proc.c:2325`):

| Rails site                                                                                                                                                | TS body                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/autosave_association.rb:159-175` `define_non_cyclic_method`: `define_method(name) do \|*args\| … end` | `packages/activerecord/src/autosave-association.ts` `defineNonCyclicMethod`: `klass.prototype[name] = function …` |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/integration.rb:147-161` `to_param(method_name)`: `define_method :to_param do … end`                   | `packages/activerecord/src/integration.ts` `ClassMethods.toParam`: `klass.prototype.toParam = function …`         |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb:232` `_enum`: `singleton_class.define_method(name.pluralize) { enum_values }`                 | `packages/activerecord/src/enum.ts` `_enum`: an `Object.defineProperty` on the class                              |

Each assigns the property by hand and carries `@missingRailsCall define_method`. ruby-compat's
`Module` already ports `defineMethod` (`packages/ruby-compat/src/include.ts`), which relinks every
includer; it has no form for a class receiver, which is what these three sites have.

The enum row also has to settle the receiver: a JS class has no metaclass apart from its own
statics (CLAUDE.md § "`singleton_class` is a per-object subclass"), so `singleton_class.define_method`
on a class defines a static.

## Acceptance criteria

- [ ] ruby-compat exports the class-receiver `define_method` (`rb_mod_define_method`), receipted and listed in the package README with these call sites.
- [ ] `defineNonCyclicMethod`, `ClassMethods.toParam` and `_enum` call it, and the three `@missingRailsCall define_method` receipts are deleted.
- [ ] `defineNonCyclicMethod` keeps Rails' `return if method_defined?(name, false)` as a `Module#method_defined?` call rather than a `hasOwnProperty` probe.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
