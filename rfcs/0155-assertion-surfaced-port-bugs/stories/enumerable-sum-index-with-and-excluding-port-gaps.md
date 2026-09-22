---
title: "enumerable-sum-index-with-and-excluding-port-gaps"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Converging `core_ext/enumerable_test.rb`'s assertions under RFC 0132 stopped at
three independent gaps in `packages/activesupport/src/enumerable-utils.ts`.
Seven tests in `packages/activesupport/src/core-ext/enumerable.test.ts` are
parked `it.skip` with a `BLOCKED:` line pointing here; their bodies are the
pre-convergence ones, because the surface they would assert against does not
exist yet.

**1. `sum` is number-only.** Rails' `Enumerable#sum`
(`vendor/rails/activesupport/lib/active_support/core_ext/enumerable.rb:16-56`)
takes an `identity` argument, raises `TypeError` on a non-summable element, and
preserves Ruby's numeric tower. trails' `sum`
(`enumerable-utils.ts:4-17`) is `reduce((acc, item) => acc + item, 0)`: no
`TypeError` arm, no string identity, no Rational/Complex. That blocks
`test_sums` (26 assertions), `test_nil_sums` (4), `test_empty_sums` (6),
`test_range_sums` (15) and `test_array_sums` (27) — including every
`assert_typed_equal` row.

**2. `excluding` does not flatten and has no Hash form.** Rails'
`Enumerable#excluding` (`core_ext/enumerable.rb:191-194`) is
`elements.flatten!(1); reject { |element| elements.include?(element) }`, and
`Hash#excluding` (`core_ext/hash/except.rb`) is a separate definition. trails'
`excluding` (`enumerable-utils.ts:122-125`) builds a `Set` of the raw varargs, so
`excluding(list, [1, 2])` excludes nothing, and `hash-utils.ts` has no
`excluding` at all. Blocks `test_excluding` (6 assertions).

**3. There is no `Enumerator`.** `test_index_with` asserts
`payments.index_with.class == Enumerator`, `index_with.size` is nil, and
`(1..42).index_with.size == 42` (`enumerable_test.rb:256-269`) — four of its
eight assertions need an arity-0 `index_with` returning an Enumerator, which
trails has no analogue for.

`test_doesnt_bust_constant_cache` (`enumerable_test.rb:403-408`) is parked with
these: it is `assert_no_difference -> { RubyVM.stat(:constant_cache_invalidations) }`,
MRI-only, and needs a decision about whether it has any trails meaning at all.

## Acceptance criteria

- [ ] `sum` takes an identity argument and raises `TypeError` where Rails does.
- [ ] `excluding` flattens one level; `Hash#excluding` exists in `hash-utils.ts`.
- [ ] `index_with`'s arity-0 form is decided (ported or recorded as unportable
      with a receipt), and `test_index_with` converges or is closed.
- [ ] The seven parked tests are un-skipped with Rails' assertion count, kinds
      and expected values, or closed with a recorded reason.
- [ ] `pnpm parity:test -- --package activesupport --assertions` reports
      `core_ext/enumerable_test.rb` at 0/0/0.
