---
rfc: "0000-parity-beyond-name-presence"
title: "Parity tooling beyond name presence — audit the denominator, then measure behaviour"
status: draft
created: 2026-09-20
updated: 2026-09-20
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activemodel"
  - "activesupport"
  - "arel"
clusters:
  - "denominator"
  - "call-gate"
  - "lints"
  - "comparers"
  - "mri-differential"
related-rfcs:
  - "0155-assertion-surfaced-port-bugs"
  - "0132-ar-closure-assertion-parity"
  - "0126-fidelity-tooling-continuation"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0113-branch-and-guard-parity"
  - "0110-parity-skip-register-correctness"
  - "0072-api-compare-parity-burndown"
priority: 6
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number. -->

# RFC — Parity tooling beyond name presence

## Summary

RFC 0155 holds 180 real port defects, every one found by hand-converging a
test's assertions, while `parity:api` reads 100% for arel, activemodel and
activerecord. The audit in [`audit-20260920.md`](audit-20260920.md) explains the
contradiction and sorts the 180 by defect shape. This RFC files the tooling that
audit found to be buildable. Together the stories reach about 85 of the 180.
About 61 have no possible tool, and this RFC does not chase them.

## Motivation

`parity:api` answers one question: does a member with one of N candidate names
exist in the paired TS file, an includer, or a parent. It answers it over a
filtered list. Measured on `4e7c35e36b`:

| Package       | Ruby defs | Scored on a row of their own | Reported |
| ------------- | --------- | ---------------------------- | -------- |
| arel          | 837       | 688 (82.2%)                  | 100%     |
| activemodel   | 700       | 557 (79.6%)                  | 100%     |
| activerecord  | 6097      | 5069 (83.1%)                 | 100%     |
| activesupport | 2537      | 1741 (68.6%)                 | 91.5%    |

Five mechanisms remove the rest (`file:line` for each is in the audit): a global
skip by name that includes `inspect`, `dup`, `initialize_dup`, `is_a?`,
`respond_to?` and `method_missing`; same-file same-name collapse across the
class/instance line; name-only matching that lets a predicate pair with a
non-boolean getter; excluded and rowless files; and stdlib includes that are
never flattened. Of the 27 "method not ported" stories in 0155, one is reported
as missing today.

The call gate has the same hole. `significantMissingCalls` suppresses a Ruby
call name that maps to no TS candidate, so `public_send`, `send`, `respond_to?`
and `inspect` never flag. `update-attribute-uses-public-send-setter` is recorded
in `call-skeletons.json` and absent from `call-mismatches.json`.

Past the surface, nothing compares rendering (`inspect`, class paths, Symbols in
messages), guard shape (`instanceof` lists where Ruby asks `respond_to?`), block
arms, or return values. Those are 17, 6, about 9 and 12 stories of the 180.

## Design

Five clusters, in the order they should land.

1. **`denominator`.** Make the number honest first. Report the own-row ratio,
   stop collapsing class and instance, un-skip protocol names that a Ruby file
   really defines, kind-check predicate matches, expect `Enumerable` /
   `Comparable` surface, and reconcile the skip registers with open stories.
   activerecord will leave 100% when this lands. That drop is the finding stated
   as a number, and the new rows are a burndown, not a regression.
2. **`call-gate`.** Stop suppressing the dynamic-dispatch call names.
3. **`lints`.** Two narrow lints. The guard lint is keyed on one call name on
   purpose: RFC 0113 measured whole-population arm comparison at 75% noise and
   runs it ungated permanently, while the single missing-`throw` stratum
   measured 88.4% real and gates. This follows the stratum precedent.
4. **`comparers`.** A block-parameter check that can gate, and a void-return
   check that starts report-only and measures its noise before any gate, the
   same discipline RFC 0113 used.
5. **`mri-differential`.** `ruby` is on PATH and Rails is vendored, and
   `scripts/parity/pipeline/` already runs Rails and trails side by side over
   206 fixtures, but diffs only SQL text and schema dumps. Add a pure-function
   type that diffs `[class, inspect, raised class, message]`, with no bundler
   and no database. The harness finds nothing by itself. The yield is in a fixed
   adversarial input table driven through every `ActiveModel::Type#cast`. This
   cluster starts with a spike and ends with a measure-then-decide story.

## Out of scope

- **`add-error-message-parity-signal`** stays in RFC 0127, where it is already
  `ready`. It is the sixth proposal of the audit and needs a claimer, not a
  second story.
- **Working activesupport's 171 already-reported misses** is RFC 0072's
  burndown, not tooling.
- **Query counts, driver behaviour, JS language walls, test-side drift and
  one-off body logic.** The audit counts about 61 such stories and explains why
  no detector can exist. Assertion convergence remains their only detector.
- **Whole-population arm comparison.** Rejected by measurement in RFC 0113.

## Rollout

Every new gate follows the repo's ratchet contract: seeded from a measurement,
only-shrink, a narrow `tighten`, no reseed. A story that introduces a signal
lands it report-only unless its body says the noise has been measured.

## Open questions

- Which global skip names are genuinely unportable (`hash`, `object_id`,
  `freeze`) and which are ported somewhere and therefore scoreable. The un-skip
  story answers it per name from the TS corpus.
- Whether `Multibyte::Chars` and `TestCase.test_order` are to be ported. A skip
  reason says no and an open 0155 story says yes.
