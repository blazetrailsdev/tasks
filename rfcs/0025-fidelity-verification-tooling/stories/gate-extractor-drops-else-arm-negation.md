---
title: "Gate extractor drops else-arm negation, colliding same-named if/else tests"
status: ready
updated: 2026-07-30
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parity:test Ruby gate extractor has no representation for a _negated_
feature gate, so the `else` arm of `if supports_X?` extracts as though it were
the `if` arm. Two cooperating causes in
`scripts/test-compare/extract-ruby-tests.rb`:

1. `process_conditional` (:562-578) walks the else branch **ungated** — the
   code comment at :559-561 says so outright: "Walks the else branch ungated."
   Line 578 is a bare `walk(els) if els.is_a?(Array)`, with no pushed gate.
2. `scan_run_condition` (:668-723) threads a `negated` flag and honours it for
   `current_adapter?` — :683 routes into `acc[:neg_adapter_syms]` vs
   `acc[:adapter_syms]`. The `supports_.+\?` branch at :686-689 ignores
   `negated` entirely and always appends to `acc[:features]`. There is no
   `neg_features` bucket at all.

Consequence, observed on #5501: `foreign_key_test.rb:453-535` defines **two**
methods named `test_add_invalid_foreign_key`, one per arm of
`if ... supports_validate_constraints?`. The `if` arm extracts as
`features=[foreign_keys, validate_constraints]`; the `else` arm extracts as
`features=[foreign_keys]`. Both are keyed on the same test name, so the matcher
pairs TS tests by name and cannot tell the arms apart.

This has already cost two PRs. #5486 (deferrable cases) ported the `else` arm
alone, and the matcher paired that single TS test with the `validate_constraints`
Rails entry — `parity:test --gates --check` reported
`[wrong-gate] "add invalid foreign key"` and exited 1, forcing a backout. #5501
resolved it only by porting **both** arms together AND hoisting the skip
condition into a module const (`migration/foreign-key.test.ts:39-44`) so the
`it.skipIf(...)` call site carries no feature literal — an inline
`adapterSupports("validate_constraints")` there re-tags the else-arm case with
the very feature it excludes, recreating the collision.

That const hoist is a workaround for this extractor gap, not a TS requirement.
Its comment is load-bearing: inlining the call re-breaks the gate check. Any
future Rails `if supports_X? / else` pair with same-named tests on both arms
hits the same trap.

Related but distinct: `gate-extractor-compound-if-positive-adapter` (0032, done)
covered compound conditions with a positive adapter predicate, not else-arm
negation. `test-compare-deliberate-gate-deviation-marker` (0025, ready) adds a
marker for intentional deviations — this story is about extracting the gate
correctly in the first place.

## Acceptance criteria

- [ ] `scan_run_condition` records negated `supports_X?` predicates in a
      dedicated bucket (e.g. `acc[:neg_features]`), mirroring the existing
      `neg_adapter_syms` treatment of `current_adapter?`.
- [ ] `process_conditional` walks the else branch under the inverted gate rather
      than ungated, so else-arm tests carry the negated feature.
- [ ] The two `test_add_invalid_foreign_key` entries from
      `foreign_key_test.rb:453-535` extract with distinguishable gates, and the
      matcher pairs each with the correct TS test in
      `packages/activerecord/src/migration/foreign-key.test.ts`.
- [ ] With that in place, the `supportsValidateConstraints` const hoist in
      `foreign-key.test.ts:39-44` can be inlined back to
      `it.skipIf(adapterSupports("validate_constraints"))` without tripping
      `[wrong-gate]` — do this, and drop the workaround comment, to prove the fix.
- [ ] `pnpm parity:test --gates --check` stays at exit 0; no regression in the
      overall gate-mismatch count.

## Re-verified 2026-08-17 (ready sweep)

Citations verified against `scripts/test-compare/extract-ruby-tests.rb`; the
ungated else-branch walk is unchanged.
