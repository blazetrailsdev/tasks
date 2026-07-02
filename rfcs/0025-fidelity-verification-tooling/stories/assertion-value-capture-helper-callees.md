---
title: "test:compare — capture expected values for helper-callee & receiver-form assertions"
status: ready
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-on from `assertion-expected-value-comparison` (PR #4398), which added
literal expected-VALUE comparison to `test:compare` but only captures the value
for `expect(...).matcher(arg)` chains (TS) and self-call `assert_*(...)` forms
(Ruby). Two shapes push a `null` value and are therefore never value-compared:

- TS helper-callee kinds — `collectAssertionKinds` in
  `scripts/test-compare/extract-ts-core.ts` does `values.push(null)` for any
  bare `assert*`/`refute*`/`expect*` helper identifier (e.g. `assertSame(a, b)`,
  `refuteEqual(a, b)`); it only parses the arg of an `expect(...)` chain.
- Ruby receiver-form assertions — `collect_assertion_kinds_expanded` in
  `scripts/test-compare/extract-ruby-tests.rb` pushes `nil` for
  `:call`/`:command_call` shapes (`x.must_equal y`, `sql.must_be_like %{…}`).

Consequence documented in `assertion-values.ts` `VALUE_BEARING_KINDS`:
`same`/`notSame` are excluded from value comparison because there is no live
path to a captured trails-side value (`toBe`→`equal` by design, and the only
`same` path is a helper callee that captures no arg). Widening capture to these
shapes would let `same`/`notSame` (and helper-form `equal`/`includes`/…) be
value-compared, closing the blind spot.

## Acceptance criteria

- TS `collectAssertionKinds` captures the mapped expected-value argument for
  helper-callee assertions whose kind is value-bearing (e.g. `assertSame`,
  `refuteEqual`, `assertIncludes`), using the same per-kind arg-index rule the
  Ruby side already applies (`expected_arg` / `INCLUDES_ASSERTIONS`).
- Ruby captures the expected value for receiver-form (`:call`/`:command_call`)
  mapped assertions where it is a literal.
- Re-add `same`/`notSame` to `VALUE_BEARING_KINDS` (and update the doc comment)
  once a live capture path exists on both sides.
- Extractor unit tests for the new capture shapes; keep count/kind lockstep
  untouched (value capture stays additive).
- Report-only; no CI gate.
