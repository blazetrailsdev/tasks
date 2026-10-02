---
title: "rbModAncestors lists a prepended module after the class; instance_method's owner is the class"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced fixing red main in trails#8369, which left one `rbModAncestors` and made `rbModInstanceMethod(...).owner` an entry of it.

Ruby's `Module#prepend` puts the module BEFORE the class in its ancestry (`vendor/ruby/v3.3.11/class.c` `rb_prepend_module`, which moves the class's method table to an origin iclass; `rb_mod_ancestors`, `class.c:1570`, then lists the prepended module first). So for `class K; prepend P; end`, `K.ancestors` is `[P, K, ...]` and `K.instance_method(:m).owner` is `P` when `P` defines `m` (`method_owner`, `vendor/ruby/v3.3.11/proc.c:1988`).

trails, `packages/ruby-compat/src/include.ts`:

- `Module#prependFeatures` copies the carrier's descriptors onto `base.prototype` and calls `trackIncludedModule`, but does not record the copied names in `trackedKeys`.
- `rbModAncestors` pushes the class first and then every module in the prototype's `includedModulesKey` registry, so a prepended module is listed AFTER the class (measured: `rbModAncestors(K)[0] === K` after `prepend(K, p)`).
- `rbModInstanceMethod` sees an own entry that is neither a `T_ICLASS` link nor a tracked mixin key and answers `link.constructor`, so the owner of a prepended method is `K`, not the module.

No caller reads either today: `SerializeCastValue::ClassMethods#serialize_cast_value_compatible?` (`activemodel/lib/active_model/type/serialize_cast_value.rb:9-12`) and `Arel::Visitors::Visitor#visit` (`activerecord/lib/arel/visitors/visitor.rb:40-42`) are the only consumers and neither class is prepended to.

## Acceptance criteria

- `rbModAncestors(K)` lists a prepended module before `K`, most recently prepended first, as MRI does.
- `rbModInstanceMethod(K, mid).owner` is the prepended module when it supplies `mid`, and `K` when only the class body does.
- The record needed is kept by `prepend` / `Module#prependFeatures` themselves (a prepended-modules registry on the prototype, distinct from the include one), not derived by comparing descriptors.
- Tests in `packages/ruby-compat/src/include.test.ts` cover a live `Module` and a plain-object module, each prepended to a class that also defines the method.
