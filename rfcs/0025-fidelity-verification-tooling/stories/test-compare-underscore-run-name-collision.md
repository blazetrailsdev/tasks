---
title: "parity:test normalization collides test__x__2 with test_x__2"
status: draft
updated: 2026-08-10
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/compare.ts:161`'s `normalize` collapses whitespace runs
(`s.toLowerCase().replace(/\s+/g, " ").trim()`), and the Ruby side maps a
method name with `desc = name.sub(/^test_/, "").tr("_", " ")`
(`scripts/test-compare/extract-ruby-tests.rb:514`). Two DIFFERENT Ruby tests in
one file therefore normalize to the same path whenever they differ only in a
leading or doubled underscore.

`vendor/date/test/date/test_date_parse.rb` has exactly that pair:
`test__parse__2` (`:477`) → `" parse  2"` and `test_parse__2` (`:563`) →
`"parse  2"`, both normalizing to `parse 2`. PR #6322 ported both; they are
credited, but the match is by luck of ordering rather than by identity, and a
future rename or a third collider would silently mis-credit or drop one.

The same shape exists elsewhere in the gem suites (`test__plus` /
`test_plus`-style pairs) and is latent in any Rails file with a `test__x` next
to a `test_x`.

## Converged shape

Make the normalized path preserve the distinction — e.g. normalize underscore
runs to a stable token rather than collapsing them into the surrounding
whitespace, on BOTH sides of the comparison — and add a guard test over a
colliding pair so a regression is caught. Whatever the spelling, the two Ruby
names must map to two distinct paths, and the existing ported names must keep
their credit.

## Acceptance criteria

- [ ] `test__parse__2` and `test_parse__2` produce distinct normalized paths.
- [ ] A unit test in `scripts/test-compare/` covers the colliding pair.
- [ ] `pnpm parity:test` totals do not regress for any package.
