---
title: "Remaining actionpack sites model a Ruby Symbol as a JS Symbol (parameters.ts, two tests)"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "A Ruby Symbol is a JS string, never a JS `Symbol`". trails#8230 removed
the JS-`Symbol` arms from `polymorphic-routes.ts` and `url-for.ts`, and later work removed
them from `abstract-controller/helpers.ts`, `action-controller/metal/helpers.ts`,
`action-controller/metal/live.ts` and `action-dispatch/journey/formatter.ts`. What is left:

- `packages/actionpack/src/action-dispatch/http/parameters.ts:81` still carries a
  `typeof key === "symbol"` arm.
- Two tests still pass JS Symbols:
  - `action-controller/metal/rendering.test.ts:94-95` passes `Symbol.for("mobile")` as a
    variant to `_processVariant` and asserts it back.
  - `action-dispatch/testing/assertions/routing.test.ts:127` passes `useRoute: Symbol("items")`.

## Acceptance criteria

- `parameters.ts` has no `typeof … === "symbol"` arm; a Ruby Symbol key is the `":name"`
  string, read with `isSymbol` / `symbolToS` from `@blazetrails/ruby-compat` where Rails'
  control flow turns on Symbol-ness.
- The two tests pass `":mobile"` / `":items"` and stay green.
- `grep -rn 'typeof [a-zA-Z.]* === "symbol"' packages/actionpack/src` finds no Ruby-Symbol
  arm (JS-symbol property keys in Proxy traps are out of scope).
