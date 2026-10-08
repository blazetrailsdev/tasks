---
title: "ruby-compat: Module#< is rbModLt; klass < ActiveRecord::Base stops being prototype instanceof"
status: draft
updated: 2026-10-08
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8680, which ported `AssociationReflection#compute_class` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:505`): `unless klass < ActiveRecord::Base`.

`Module#<` is `rb_mod_lt` (`vendor/ruby/v3.3.11/object.c:1842`): `false` when `mod == arg`, else `rb_class_inherited_p(mod, arg)`. ruby-compat exports `rbClassInheritedP` (`packages/ruby-compat/src/include.ts`, `Module#<=`) and has no `<`. Each Rails `klass < ActiveRecord::Base` is hand-written as `klass.prototype instanceof ActiveRecord.Base`:

- `packages/activerecord/src/reflection.ts` `AssociationReflection#computeClass` (`reflection.rb:505`)
- `packages/activerecord/src/inheritance.ts` `setBaseClass` (`inheritance.rb:273`)
- `packages/activerecord/src/model-schema.ts:69`
- `packages/activerecord/src/fixtures.ts:377`
- `packages/activerecord/src/associations/belongs-to-association.ts:97`

`instanceof` on a prototype throws `TypeError` for a non-class left operand and does not see a module included through ruby-compat's `include`, where `rb_class_inherited_p` searches the ancestry and raises "compared with non class/module" for a non-module argument.

## Converged shape

ruby-compat exports `rbModLt(mod, arg)` over `rbClassInheritedP`, receipted `@noRailsEquivalent PERMANENT`, and each site above calls it. Check each site's Rails line first: one written `<=` or `is_a?` in Rails takes that port, not this one.

## Acceptance criteria

- [ ] `rbModLt` is exported from ruby-compat with an MRI citation and a unit test covering equal classes, a subclass, an unrelated class, and a non-module argument.
- [ ] Every `x.prototype instanceof ActiveRecord.Base` whose Rails line is `x < ActiveRecord::Base` calls `rbModLt`.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` stay green.
