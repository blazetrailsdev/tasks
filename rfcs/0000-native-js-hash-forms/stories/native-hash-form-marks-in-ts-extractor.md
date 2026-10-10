---
title: "TS extractor marks the native hash forms: in / Object.hasOwn, delete, Object.assign, spread, Object.entries loop"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The call gates credit a Ruby hash call only when the TS body makes a call of a
mapped name, which is why ports call `hasKey(h, k)` rather than write `k in h`
(RFC § "Why the helpers exist"). The extractor already has a way to record a
construct that has no callee: it adds a name with `NATIVE_FORM_PREFIX` (`@`,
`scripts/api-compare/enumerable-idioms.ts:192`) to the body's call SET, never
the ORDER stream. `scripts/api-compare/extract-ts-api.ts:6693-6801` emits
`@String`, `@timer`, `@unshift`, `@import`, `@invoked:<name>`, `@length` and
`@length:<receiver tail>` this way, and `splitCalls`
(`enumerable-idioms.ts:317-331`) separates them into `nativeForms`.

Nothing is marked for the hash forms. `in` is read in two narrow places only:
the missing-keyword guard (`extract-ts-api.ts:5584`) and option-key collection
(`:7415`).

This story adds the marks and changes no crediting. It is the first of the
gate cluster and every other story in the RFC depends on it, directly or
through `native-hash-forms-credit-key-delete-merge`.

## Acceptance criteria

- [ ] `collectCalls` (`extract-ts-api.ts:6605`) adds, each both bare and with
      the receiver's trailing name in the way `@length:<tail>` is built:
  - `@in` for a `BinaryExpression` with `InKeyword` (receiver: the right
    operand) and for `Object.hasOwn(recv, k)` /
    `Object.prototype.hasOwnProperty.call(recv, k)` (receiver: the first
    argument);
  - `@delete` for a `DeleteExpression` over a property or element access
    (receiver: the accessed expression);
  - `@assign` for `Object.assign(recv, ...)` (receiver: the first argument);
  - `@spread` for an object literal with at least one spread (one mark per
    spread operand, receiver: the operand);
  - `@entries` for `for (const [k, v] of Object.entries(recv))` (receiver: the
    argument).
- [ ] The marks are in the call SET only. The ORDER stream, the arms skeleton
      and `callSites` are byte-identical before and after for every package:
      diff `scripts/api-compare/output/` artifacts from a forced run on `main`
      and on the branch, and state the result in the PR body.
- [ ] `in` used by `isArgumentBindingGuard`-style keyword guards (`:5584`) is
      not double-read: the guard's existing handling is unchanged.
- [ ] Extractor tests cover each construct, the receiver-tail spelling for
      `this.options`, `options` and `opts[name]`, and a negative for
      `Object.keys(recv)` (no `@entries`) and for an object literal with no
      spread (no `@spread`).
- [ ] `pnpm parity:api:calls`, `:calls:args` and `pnpm parity:api:arms:throws`
      are green with no baseline change. Nothing reads the new marks yet, so
      any movement is a bug in this story.

## Verification

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
pnpm vitest run scripts/api-compare
```

## Notes

The per-package TS cache is keyed by `packageFingerprint`
(`extract-ts-api.ts:122-130`); bump whatever version it includes so a warm
cache does not hide the new marks.
