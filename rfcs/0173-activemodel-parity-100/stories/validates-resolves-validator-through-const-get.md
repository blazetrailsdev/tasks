---
title: "validates-resolves-validator-through-const-get"
status: ready
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
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

## Context

`validates` resolves each validator with `const_get(key)` on the model class
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/validates.rb:120-124`),
which finds a constant on the class, on an included module — the bundled
validators are constants of `ActiveModel::Validations` — or at top level, and
raises `NameError` on a miss.

`packages/activemodel/src/validations/validates.ts` instead reads
`this[key] ?? BUNDLED_VALIDATORS[key] ?? constantize(key)`: a property read, a
file-local table of the eleven bundled validators, and the global constant
registry. The `begin … rescue NameError` around it is ported; the lookup is not.

`rbConstGet` (`packages/ruby-compat/src/variable.ts`) is the port of
`rb_const_get`, but it only walks the class's own prototype chain (`id in
klass`), so it sees neither a constant seated on an included module nor a
top-level one. The call gate does not flag `const_get` here, so nothing tracks
this today.

## Acceptance criteria

- [ ] The bundled validators are seated as constants on `Validations` (as
      `ActiveModel::Validations::PresenceValidator` is), and `BUNDLED_VALIDATORS`
      is deleted.
- [ ] `validates` resolves the validator through one `const_get`-shaped call that
      reaches the class, its included modules and top-level constants.
- [ ] `validates with unknown validator`, `validates with included validator`
      and `validates with namespaced validator` (validates_test.rb) still pass.
