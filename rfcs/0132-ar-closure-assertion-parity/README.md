---
rfc: "0132-ar-closure-assertion-parity"
title: "ActiveRecord closure assertion parity to zero"
status: active
created: 2026-08-31
updated: 2026-08-31
owner: "@deanmarano"
packages:
  - activerecord
  - activesupport
  - activemodel
  - date
  - globalid
  - i18n
clusters:
  - assertion-parity
  - enforcement
related-rfcs:
  - "0105-ar-deps-test-parity-100"
  - "0122-arel-assertion-parity"
  - "0025-fidelity-verification-tooling"
priority: 10
---

# ActiveRecord closure assertion parity to zero

## Why this RFC exists

RFC 0105 (`ar-deps-test-parity-100`) opened with a measured claim that it then
carried on its own back: **the name gate is the smaller half of the truth.** A
test that matches a Rails test by name but asserts a different number of
things, a different kind of thing, or a different expected value is not a port
of that test — and there were an order of magnitude more of those than there
were unported names.

0105 has now delivered its headline metric. `pnpm parity:test` reads:

| package       | name gate            |
| ------------- | -------------------- |
| activerecord  | 8372/8372 — **100%** |
| activemodel   | 963/963 — **100%**   |
| arel          | 739/739 — **100%**   |
| date          | 137/137 — **100%**   |
| globalid      | 131/131 — **100%**   |
| did-you-mean  | 6/6 — **100%**       |
| i18n          | 291/307 — 94.8%      |
| activesupport | 2547/2965 — 85.9%    |

What 0105 has NOT delivered, and what its remaining queue was mostly made of,
is the assertion axis. That axis is a different gate, with a different ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`), a different end
condition, and a burndown roughly ten times the size of the name tail it was
sharing an RFC with. Keeping the two together made 0105 unclosable and made
neither axis's progress legible.

**This RFC owns the assertion axis for the ActiveRecord closure.** 0105 stays
open for exactly one thing: the activesupport + i18n name-gap tail.

## Scope

Three dimensions, reported by `pnpm parity:test -- --assertions` and pinned per
package by `scripts/test-compare/assertion-mismatch-mark.json`:

- **assertion-count** — the trails test makes a different number of assertions
  than the Rails test it mirrors.
- **assertion-kind** — it makes the same number, of different kinds
  (`assert_equal` → `toEqual`, `assert_nil` → `toBeNull`; the mapping lives in
  `scripts/test-compare/assertion-kinds.ts`).
- **assertion-value** — same kind, different expected value.

Measured 2026-08-31 (`pnpm parity:test`, cached, vendored Rails):

| package       | count |  kind | value |     total |
| ------------- | ----: | ----: | ----: | --------: |
| activerecord  | 1,861 | 3,804 |    31 |     5,696 |
| activesupport |   861 | 1,210 |   103 |     2,174 |
| activemodel   |   285 |   436 |    53 |       774 |
| globalid      |    24 |    27 |     1 |        52 |
| date          |     1 |     1 |     0 |         2 |
| arel          |     0 |     0 |     0 |         0 |
| i18n          |     0 |     0 |     0 |         0 |
| did-you-mean  |     0 |     0 |     0 |         0 |
| **total**     | 3,032 | 5,478 |   188 | **8,698** |

`arel` reads zero because **RFC 0122 already finished it** — that RFC is the
precedent this one follows at closure scale, and its triage rule, its
tooling-versus-divergence split, and its "the trails side stays vitest-native"
decision carry over here rather than being restated per story. `i18n` reads
zero because 0105's `assertion-extractor-counts-mocha-expects` story taught the
extractor to count mocha's `foo.expects(:bar)`.

Out of scope: every package outside the AR closure. `actioncontroller`,
`actiondispatch`, `actionview`, `rack` and friends are measured in the same
mark file and are not this RFC's problem.

## Constraints every story here inherits

- **NEVER rename or reword a test name.** Names are how `parity:test` matches.
  If a test's behaviour does not fit its name, the implementation changes.
- The mark file is **only-shrink**. Edit down the numbers you converged; never
  reseed, and never raise a package's entry to make a run green.
- `assertion-kinds.ts` moves **every** package's numbers. Any change to it
  reports its effect on all marks in the file, before and after.
- A mapping rule is not a way to make a real divergence disappear. Each rule
  carries a one-line justification a reviewer can check against both sides'
  semantics, citing the Ruby `file:line` that defines the helper.

## Triage rule for the per-file stories

Every mismatch lands in exactly one bucket (RFC 0122's rule, unchanged except
for the third):

- **real divergence** — the trails test asserts something different from the
  Rails test. Fix the test to mirror the Ruby.
- **legitimate trails-only extra** — an assertion with no Rails counterpart.
  Move it to a `.trails.test.ts` sibling. Do not delete rigour, and do not
  leave it inflating a mirrored test's count.
- **missing production surface** — the assertion cannot be written because the
  thing it asserts about is not ported. That is a separate story against the
  package, not a test edit; four such stories are already here
  (`date-ext-to-fs-readable-inspect-xmlschema-surface`,
  `decimal-cast-value-to-s-fallback`,
  `globalid-locator-single-argument-deprecation`,
  `type-registry-variadic-lookup-forwarding`).
- **tooling false positive** — a further mapping or extractor gap goes into
  `assertion-kinds.ts` or the extractor with its own justification, not into a
  per-file workaround. `expects-canonical-kind-enrollment` is the open one.

## Clusters

- **`assertion-parity`** — the per-file burndown, one story per Rails source
  cluster, each sized to a single PR. The bulk of the work.
- **`enforcement`** — `flip-assertion-mismatch-gate-to-hard-zero`, which turns
  the report-only ratchet into a hard gate once a package reaches zero. It is
  the story that makes the burndown permanent, and it cannot land before the
  packages it gates are clean.

## End condition

`pnpm parity:test -- --assertions` reports `0 assertion-count-mismatch,
0 assertion-kind-mismatch, 0 assertion-value-mismatch` for activerecord,
activesupport, activemodel, arel, date, globalid, i18n and did-you-mean; those
eight entries in `assertion-mismatch-mark.json` read `0 / 0 / 0`; and the gate
is hard rather than report-only for all eight, so they cannot regress.

## Relationship to RFC 0105

0105 keeps its delivered assertion history — the assertion stories it actually
landed stay in its directory as the record of that work, and its README's
problem statement is the derivation of the numbers above. Only the open queue
moved here. 0105's remaining scope is the activesupport in-closure and i18n
name-gap ports plus the counting-hygiene drafts, and it closes when
`parity:test` reads 100% for those two packages.
