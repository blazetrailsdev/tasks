---
title: "Helper modules are ruby-compat Modules, so modules_for_helpers' when Module arm rejects a Hash"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8577
claim: "2026-10-06T14:09:41Z"
assignee: "fresh-when-array-of-records-has-no-enumerable-maximum"
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Helpers::Resolution#modules_for_helpers`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:33-47`)
takes a module through `when Module` (`:38`) and raises `ArgumentError` for
anything that is not a Module, String or Symbol (`:44`).

trails' port (`packages/actionpack/src/abstract-controller/helpers.ts`,
`Resolution.modulesForHelpers`) spells that arm
`rbObjIsKindOf(x, Module) || rbObjClass(x) === Hash`. The second disjunct is
there because a helper module is a plain object literal
(`HelperMethodsModule = Record<string, fn>`): application helpers exported as
`const FooHelper = {…}`, the modules `defineHelpersModule` builds with
`Object.create`, and the helper fixtures. ruby-compat classifies every plain
object as `Hash`, so a Hash (`{}`, an options hash) passes as a module where
Rails raises.

## Acceptance criteria

- A helper module is a ruby-compat `Module` (or a class module) everywhere one
  is built or loaded: `defineHelpersModule`, `helperConstants` in
  `packages/trailties/src/trailties/action-controller.ts`, and the actionpack /
  actionview helper fixtures.
- `Resolution.modulesForHelpers`' module arm is `rbObjIsKindOf(x, Module)` alone,
  and a plain object raises `ArgumentError("helper must be a String, Symbol, or Module")`.
- A test covers the Hash rejection.
