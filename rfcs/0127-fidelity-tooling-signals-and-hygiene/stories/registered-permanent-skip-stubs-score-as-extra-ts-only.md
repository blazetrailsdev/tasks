---
title: "parity:test scores a registered PERMANENT-SKIP stub as extra (TS only)"
status: draft
updated: 2026-10-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8317, which registered ten permanently-unportable Rails tests in
`scripts/parity/unported-files/` (CLAUDE.md § "Method visibility is compile-time only") while
keeping each one's Rails-converged body as `it.skip` under a `PERMANENT-SKIP:` line.

`scripts/test-compare/compare.ts` subtracts a `tests:` register entry from the Rails side before
pairing, so the TS `it.skip` of the same name has no Rails twin left to pair with and is scored
`extra (TS only)`. Observed on that PR: `configurable_test.rb` went from `9/10, 1 skipped` to
`9/9 ✓` with `Extra 1` the moment `the config_accessor method should not be publicly callable`
was registered (`packages/activesupport/src/configurable.test.ts`,
`scripts/parity/unported-files/activesupport.ts`).

So every registered permanent skip that keeps its stub adds one to `extra (TS only)`:

- activerecord: the four `attribute_methods_test.rb` access-control cases
  (`vendor/rails/v8.0.2/activerecord/test/cases/attribute_methods_test.rb:998-1033`), the
  has-one / has-one-through / belongs-to "…proxy should not respond to private methods" stubs,
  and the older Thread / Marshal / YAML rows that keep a stub.
- activesupport: the five `core_ext/module_test.rb:500-590` private-delegate cases and
  `configurable_test.rb:125-131`.

RFC 0175's close-out asks for `0 extra` on activerecord
(`activerecord-test-parity-100-close-out`), which these stubs make unreachable without deleting
bodies the repo deliberately keeps. `scripts/parity/unported-live-test.test.ts` already treats a
registered name with an `it.skip` twin as the consistent state, so the two tools disagree about
what that state is.

## Acceptance criteria

- [ ] A TS test that is `it.skip` / `it.todo` AND whose (Rails file, class, name) is named by a
      `tests:` entry in the unported register is scored neither `extra (TS only)` nor `skipped`:
      it is the register's TS-side marker and is reported in its own bucket (or not at all).
- [ ] A LIVE test of a registered name is still `extra`, so
      `unported-live-test.test.ts`'s contradiction stays visible in `parity:test` too.
- [ ] `scripts/test-compare/compare.test.ts` pins both arms.
- [ ] `pnpm parity:test` `extra (TS only)` for activerecord and activesupport drops by exactly
      the number of registered skip stubs; matched counts and percentages do not move.
