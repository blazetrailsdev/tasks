---
title: "expects-canonical-kind-enrollment"
status: ready
updated: 2026-08-21
rfc: "0105-ar-deps-test-parity-100"
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

Split out of `assertion-extractor-counts-mocha-expects`, which landed the
assertion-COUNT half: `scripts/test-compare/extract-ruby-tests.rb`'s
`assertion_method?` now counts mocha's `foo.expects(:bar)` (and threads the
`.never` modifier down as an `expects_never` token), so the six i18n tests that
spelled a mocha expectation as `expect(spy).toHaveBeenCalledWith(...)` no longer
report `rails 0 vs trails 1`. i18n is now 0/0/0 on assertions.

What that PR deliberately did NOT do is enroll either side in
`scripts/test-compare/assertion-kinds.ts`. Both `expects` (Rails) and
`toHaveBeenCalled` / `toHaveBeenCalledWith` / `toHaveBeenCalledTimes` (trails)
stay unmapped, so they compare as "we can't compare this" rather than as a
matched kind.

Enrolling them was measured on 2026-08-21 and is its own burndown, not a
tooling change: adding `toHaveBeenCalled*: "called"` to `TRAILS_MAP` surfaces

- activerecord: assertion-kind 3970 -> 4053 (+83)
- activesupport: assertion-kind 1227 -> 1240 (+13)
- arel: assertion-kind 591 -> 592 (+1)

pre-existing port divergences — trails ports that assert a spy call where the
Rails test asserts something else entirely (typically `assert_equal` over a
recorded log array). Those are real divergences worth surfacing, but they are
~97 rows of unrelated convergence work and the ratchet in
`scripts/test-compare/assertion-mismatch-mark.json` is only-shrink, so they
cannot ride along with the extractor change.

## Acceptance criteria

- `assertion-kinds.ts` gains a `called` / `notCalled` canonical kind pair, with
  `expects` -> `called` and `expects_never` -> `notCalled` on the Rails side and
  the `toHaveBeenCalled*` matchers on the trails side.
- Every divergence the enrollment surfaces is converged Rails-ward (our test
  asserts what the Rails test asserts) — not baselined, and the mark is never
  hand-edited upward.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered on a passing run.
- No test name changes; `pnpm parity:test` percent does not drop for any package.
- If this is larger than one PR, ship what fits and file the remainder.
