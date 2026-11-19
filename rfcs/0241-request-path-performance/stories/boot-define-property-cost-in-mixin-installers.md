---
title: "boot-define-property-cost-in-mixin-installers"
status: ready
updated: 2026-11-19
rfc: "0241-request-path-performance"
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

Follow-up to boot-module-eval-cost-of-mixin-machinery (that PR cut `rbClassPath`'s ~18 ms of generated-thunk compiles). Unbundled boot profile of activerecord+actionpack+actionview+trailties dist (`node --cpu-prof --cpu-prof-interval 50`) still shows, as self time:

- `rbModAppendFeatures` (`packages/ruby-compat/lib/include.ts:1555`) ~25 ms over 423 calls. Instrumented: `Object.defineProperties(klass.prototype, …)` is ~14 ms for 3,254 properties; `Object.getOwnPropertyDescriptors` ~4 ms; `rbSeatSuper` ~4 ms over 8,384 calls.
- `extendObject` (`include.ts:2139`) ~11–13 ms, mostly per-key `Object.defineProperty(klass, …)`.
- `ClassAttribute.redefineMethod` (`packages/activesupport/lib/class-attribute.ts:46`) ~13 ms, one `Object.defineProperty` per accessor.
- `@js-temporal/polyfill` `IndianHelper` ~18 ms at module eval (third-party); the `date` package's 685 KB bundle weight.

The remaining cost is mostly V8 `defineProperty` on dictionary-mode prototypes and constructors, so a cut has to batch or avoid redefinitions without changing semantics.

## Acceptance criteria

- Investigate batching `extendObject` / `redefineMethod` definitions (one `defineProperties` per call) and measure outside vitest.
- Investigate deferring the Temporal polyfill load until first Temporal use, or report why not.
- Record before/after self time per change.
