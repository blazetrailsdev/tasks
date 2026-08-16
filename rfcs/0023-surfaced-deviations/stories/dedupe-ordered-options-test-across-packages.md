---
title: "Delete the activerecord copy of OrderedOptionsTest, keeping one owned by activesupport"
status: draft
updated: 2026-08-16
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
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

Surfaced in #6611: the SQLite lane went red on a test file I had not run, because
`OrderedOptionsTest` exists TWICE in trails:

- `packages/activesupport/src/ordered-options.test.ts`
- `packages/activerecord/src/ordered-options.test.ts` (imports from
  `@blazetrails/activesupport`, header says "Tests to increase Rails test coverage
  matching")

Rails has one file, `activesupport/test/ordered_options_test.rb`, and `parity:test` maps
a trails test to it by name — so the duplicate contributes nothing to coverage while
doubling the blast radius of any `OrderedOptions` change. It cost a full CI round here:
the activerecord copy still asserted the pre-convergence trails behaviour (own-only
`to_h`/`each`/`inspect`, a `?` arm `method_missing` never had, `has`) and only failed in
CI after the activesupport copy was green locally.

Neither copy is a superset: the activerecord one has `introspection` via `in`, the bang
arms and `key`; the activesupport one has `dig`, `isExtractableOptions` and the
`isOverridden` cases.

## Converged shape

One `OrderedOptionsTest` in the package that owns the class —
`packages/activesupport/src/ordered-options.test.ts` — carrying the union of what the two
files assert, each `it` name still matching its `ordered_options_test.rb` `def test_*`.
Delete `packages/activerecord/src/ordered-options.test.ts`.

Check `parity:test` before and after: the activerecord copy may be what currently credits
those Rails test names in the activerecord population, in which case the delta has to
come out non-negative by the activesupport copy claiming them (they are the same names,
so it should — verify, don't assume).

## Acceptance criteria

- [ ] `packages/activerecord/src/ordered-options.test.ts` is deleted; every assertion it
      made that the activesupport copy lacked has moved there under the same test name.
- [ ] `pnpm parity:test` delta is non-negative.
- [ ] No other AR-side test file duplicates an activesupport-owned Rails test file (grep
      for the same `describe` name across packages while you are here; file separately if
      there are more).
