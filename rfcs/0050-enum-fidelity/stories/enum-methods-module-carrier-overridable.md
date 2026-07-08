---
title: "Generated enum methods live on a module carrier so class-body overrides + super work"
status: claimed
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 30
pr: null
claim: "2026-07-08T21:37:35Z"
assignee: "enum-methods-module-carrier-overridable"
blocked-by: null
closed-reason: null
---

## Context

Rails test "enum methods are overwritable"
(vendor/rails/activerecord/test/cases/enum_test.rb:190-193) asserts that a
model-body `def published!; super; "do publish work..."; end` (Book,
vendor/rails/activerecord/test/models/book.rb) overrides the generated bang and
can call `super` into it. This works in Rails because `_enum_methods_module`
(enum.rb:251-259) is an anonymous module `include`d into the class — generated
methods live BELOW the class body in the ancestor chain, so a class-body method
shadows them and `super` reaches the generated one.

trails' `EnumMethods.defineEnumMethods`
(packages/activerecord/src/enum.ts:307-345) installs the predicate/bang via
`Object.defineProperty(klass.prototype, ...)` — directly ON the class prototype.
A class-body method defined before the `static { this.enum(...) }` block is
clobbered by the generation (class bodies evaluate instance methods before
static blocks), and there is no `super` chain to the generated method.
`enum.test.ts:202` keeps `it.skip("enum methods are overwritable")`; the nearby
"overriding enum method should not raise" test only asserts no-throw, not
override semantics.

This is the enum-specific instance of the RFC 0058 module-carrier mechanism:
generated methods should live on an interposed prototype carrier (as
`_enumMethodsModule` was intended to be), not the class prototype.

## Acceptance criteria

- [ ] Enum-generated predicate/bang methods are installed on a per-class
      carrier object interposed in the prototype chain (or equivalent) such
      that a class-body method of the same name wins and can delegate to the
      generated method (trails' `super`-equivalent), mirroring Rails'
      `_enum_methods_module` include semantics.
- [ ] Un-skip `enum.test.ts` "enum methods are overwritable" (Book's
      `published!` override per book.rb) — test name unchanged.
- [ ] Existing enum generation/conflict-detection tests stay green;
      `api:compare` for enum.rb non-regressing.
