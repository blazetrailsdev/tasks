---
title: "parity:test normalization collides test__x__2 with test_x__2"
status: draft
updated: 2026-08-10
rfc: "0126-fidelity-tooling-continuation"
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

## Re-verified 2026-08-17 (draft sweep)

Still valid; **one line number drifted**. `normalize` is now at
`scripts/test-compare/compare.ts:176` (was `:161`) and still reads
`s.toLowerCase().replace(/\s+/g, " ").trim()`. The Ruby side is unchanged at
`scripts/test-compare/extract-ruby-tests.rb:514`
(`desc = name.sub(/^test_/, "").tr("_", " ")`).

## New evidence 2026-08-17 (PR #6661, RFC 0088)

The collision costs more than mis-credit-by-luck: it produces a **false
assertion-count mismatch that reds `pnpm parity:test:assertions`**, and it
forces unrelated tests to land in the same PR.

`vendor/date/test/date/test_date_parse.rb` has four colliding pairs beyond the
`test__parse__2` one above — `test__iso8601` (`:714`) / `test_iso8601`
(`:1123`), `test__xmlschema` (`:893`) / `test_xmlschema` (`:1149`),
`test__jisx0301` (`:1042`) / `test_jisx0301` (`:1196`), and `test__parse`
(`:8`) / `test_parse` (`:214`). Each pair normalizes to one path
(`testdateparse > iso8601` and friends).

Porting only ONE side of a pair makes the greedy matcher in `compare.ts`'s
pass 1 hand the single TS test to whichever Ruby test comes first in file
order — the `test__` one. PR #6661 hit this: an `it("iso8601")` carrying
`test_iso8601`'s 6 assertions was matched against `test__iso8601`'s 49, and
`parity:test:assertions` reported `+3` count and kind mismatches for work that
was in fact a faithful port. The only way to ship green was to drop the three
builder tests and land the `rfc3339` pair whole, deferring the rest to
`0088-date-gem-port/port-test-date-parse-formats-iso8601-tests` with an
explicit "never split a pair" constraint written into it.

The last remaining `date` assertion-count mismatch is the same artefact:
`testdateparse > parse` reports rails 3 vs trails 6, because unported
`test__parse` (`:8`, 3 extractor-visible `assert_equal`s inside a table loop)
is matched against the ported `it("parse")` (`test_parse`, `:214`). It will
resolve on its own when `test__parse` lands — nothing is actually divergent.

So the acceptance criteria below should also cover:

- [ ] Porting one side of a `test__x` / `test_x` pair does not change the
      other side's assertion-count/kind mismatch numbers.
- [ ] The four `test_date_parse.rb` pairs above each produce two distinct
      normalized paths.
