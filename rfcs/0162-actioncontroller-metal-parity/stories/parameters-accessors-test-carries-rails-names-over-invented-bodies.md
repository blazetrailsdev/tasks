---
title: "controller/parameters/accessors.test.ts carries Rails names over invented bodies"
status: in-progress
updated: 2026-10-09
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8709
claim: "2026-10-09T14:11:08Z"
assignee: "parameters-accessors-test-carries-rails-names-over-invented-bodies"
blocked-by: null
closed-reason: null
---

## Context

Split from `parameters-test-files-carry-rails-names-over-invented-bodies`, whose
PR rewrote `equality.test.ts`, `mutators.test.ts` and
`nested-parameters-permit.test.ts` under
`packages/actionpack/src/action-controller/controller/parameters/` from their
Rails counterparts and stopped at the PR LOC ceiling.

These files still carry the Rails test names over invented bodies: a one-off
`new Parameters({ a: "1" })` where
`vendor/rails/v8.0.2/actionpack/test/controller/parameters/*_test.rb` builds the
shared `@params` in `setup`, and `expect(...)` assertions simpler than Rails'.
`pnpm parity:test --json` (`scripts/test-compare/output/convention-comparison.json`,
package `actioncontroller`) reported, at the split:

- `accessors.test.ts` (`accessors_test.rb`, 77 tests): 31 assertion-count and 68 kind mismatches.

Port conventions the first PR settled: `assert_predicate x, :permitted?` is
`assertPredicate(x, (p) => p.permitted)`; `assert_raises(E) { }` is
`await assertRaises([E], {}, () => { })`; a Rails same-file helper
(`assert_filtered_out`) is a bare-called function inside the `describe`;
`params[:a][:b]` is `(params.get("a") as Parameters).get("b")`.

## Acceptance criteria

- [ ] The file is rewritten from its Rails counterpart: the same `setup`
      fixture, the same statements and the same assertions per test.
- [ ] A test whose Rails assertions fail against the port is parked `it.skip`
      under a `BLOCKED:` line naming a filed story, with the Rails body kept.
- [ ] `pnpm parity:test:assertions` stays green and the actioncontroller
      assertion mark is lowered by hand to the new counts.
