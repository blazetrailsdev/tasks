---
title: "activesupport: methods that thread super_ as a first parameter take Rails' parameter list"
status: draft
updated: 2026-10-02
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: ["activesupport", "trailties"]
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

The arity check in `scripts/api-compare/compare.ts` pooled every TS signature of a name across the
package, so a `super_`-threading port was credited by any unrelated same-named method. It now
compares a `super_`-threading signature in the matched file alone (`threadsSuper`,
`scripts/api-compare/arity.ts`), which surfaced these rows. Each carries one leading parameter Rails
does not declare, the object-literal `prepend()` shape:

- `packages/activesupport/src/concurrency/load-interlock-aware-monitor.ts` — `monEnter(super_)`, `synchronize(super_, block)` (`concurrency/load_interlock_aware_monitor.rb`).
- `packages/activesupport/src/core-ext/range/compare-range.ts` — `isInclude(super_, value)` (`core_ext/range/compare_range.rb`).
- `packages/activesupport/src/core-ext/range/each.ts` — `each(super_)`, `step(super_, n)` (`core_ext/range/each.rb`).
- `packages/activesupport/src/messages/rotator.ts` — `readMessage(super_, message, options)` (`messages/rotator.rb`).
- `packages/activesupport/src/testing/setup-and-teardown.ts` — `beforeSetup(super_)`, `afterTeardown(super_)` (`testing/setup_and_teardown.rb`).
- `packages/activesupport/src/testing/tests-without-assertions.ts` — `afterTeardown(super_)` (`testing/tests_without_assertions.rb`).
- `packages/trailties/src/thor/error.ts` — `toString(super_)` (thor's `error.rb`).

The converged shape is the one ActiveModel's methods now have (`packages/activemodel/src/dirty.ts`,
`validations.ts`): the method takes Rails' parameter list and calls
`<Module>.superMethod(this, "<name>")!(...)`, with the module's link included or prepended in
Rails' ancestry order. `Module#superMethod` ends its search in ruby-compat's `Kernel`.

`converge-two-prepends-in-activesupport` covers the two `prepend()` functions themselves; this
story is the call sites.

## Acceptance criteria

- [ ] Each method above takes Rails' parameter list and reaches the next implementation through `superMethod`, not a threaded `super_`.
- [ ] `pnpm parity:api --arity` lists no activesupport or thor row whose TS signature opens with `super_`.
- [ ] The suites beside each file stay green.
