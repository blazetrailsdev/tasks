---
title: "Concern re-include re-fires the included body where concern.rb returns false"
status: draft
updated: 2026-09-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

`ActiveSupport::Concern#append_features`
(`vendor/rails/activesupport/lib/active_support/concern.rb:129-140`) opens with

```ruby
return false if base < self
```

so including a Concern into a class that ALREADY has it is a genuine no-op: the
`@_included_block` at `:138` does not re-run, and `ClassMethods` is not
re-extended.

trails' `Validations` (`packages/activemodel/src/validations.ts:55`) is a
Concern port, but it carries its included body on the `[included]` symbol hook
rather than on an `appendFeatures`. `include()`
(`packages/ruby-compat/src/include.ts:615-623`) checks `featureHook(mod,
"appendFeatures")` FIRST and only then falls through to the
already-included branch, which still fires `[included]`:

```ts
if (isModuleMethodTablePresent(klass, mod)) {
  if (typeof (mod as ModuleHooks)[included] === "function") {
    (mod as ModuleHooks)[included]!(klass);
  }
  return;
}
```

That fall-through is correct for a plain Ruby module — `rb_mod_include` fires
`id_included` unconditionally, once per call (`vendor/ruby/eval.c:1156-1160`,
as `prepend-has-no-prepended-hook` in this RFC already cites). It is wrong for
a Concern, which suppresses the block itself.

trails#7901 added the first re-include call site: `has_secure_password` now
spells `include ActiveModel::Validations`
(`activemodel/lib/active_model/secure_password.rb:128`), and every model that
extends `Model` already has it. So `Validations[included]` re-runs
`defineCallbacks(base.prototype, "validate", …)` and
`classAttribute(base, "_validators", { default: new Map() })` on that subclass.

**Probed, and currently benign:** a temporary test declaring a `validate`
before `hasSecurePassword` in the same class body still had that validator run
after it, and the whole activemodel suite (1942 tests) is green. Both re-run
operations are idempotent as written. This is filed as a latent divergence, not
a live bug — size it accordingly.

The converged shape is a Concern-style guard so a re-include is a no-op, either
by giving `Validations` an `appendFeatures` that returns false when the class
already has it, or by making the `[included]` fall-through in `include()`
respect the same condition for Concern-shaped modules.

## Acceptance criteria

- [ ] Re-including `Validations` into a class that already has it does not
      re-run its included body, matching `concern.rb:134`.
- [ ] A plain (non-Concern) Ruby module still fires `included` on every
      `include()` call, matching `vendor/ruby/eval.c:1156-1160`.
- [ ] A regression test covers both arms and fails on the current baseline.
