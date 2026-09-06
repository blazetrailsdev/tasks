---
title: "activemodel: cases/lint_test.rb sits outside the test-compare population"
status: blocked
updated: 2026-09-06
rfc: "0123-blocked-convergence-holding"
cluster: test-placement
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-02T22:05:40Z"
assignee: "type-value-split-and-name-property-burndown"
blocked-by: "Still blocked, re-verified 2026-09-06 against origin/main. Scope remains the lint half only (serializers half satisfied; activemodel 56/56 files). vendor/rails/activemodel/test/cases/lint_test.rb still defines no test methods — the six tests live in lib/active_model/lint.rb, outside every scanned test dir. The gate is still the only-shrink assertion ratchet: scripts/test-compare/extract-ts-core.ts still folds SAME-FILE helpers only, so the TS mirror extracts zero assertions against the six Ruby tests' 2/2/2/2/7/2, raising activemodel's assertionCount mismatch by 6. Headroom has SHRUNK further since the last reason was written: the committed mark in scripts/test-compare/assertion-mismatch-mark.json is now activemodel.assertionCount 277 (was 281, originally 286). Unblocks on exactly one of: cross-file helper folding in extract-ts-core.ts (the real fix), or converging six-plus of activemodel's existing count mismatches and enrolling in the same PR."
closed-reason: null
---

## Context

`pnpm parity:test` counts 56 activemodel `rubyFiles` while
`vendor/rails/activemodel/test` holds 57 `*_test.rb`. The diff is
`cases/lint_test.rb`, excluded from the compare population even though
`packages/activemodel/src/lint.test.ts` exists.

**The serializers half of this story is already satisfied on main** and is out
of scope: `cases/serializers/json_serialization_test.rb` IS in the population
and matches `packages/activemodel/src/serializers/json-serialization.test.ts`,
so activemodel sits at 56/56 files matched.

What remains is the lint half, and it is blocked by an only-shrink gate rather
than by a missing mapping. `vendor/rails/activemodel/test/cases/lint_test.rb:5`
defines no test methods at all — its body is `include ActiveModel::Lint::Tests`
plus a `CompliantModel` — and the six tests live in
`vendor/rails/activemodel/lib/active_model/lint.rb:31-107`, outside every
scanned test dir. Teaching `extract-ruby-tests.rb` to walk that lib file (an
`EXTERNAL_TEST_MIXINS` map re-keying the collected module under the constant
path the `include` spells, ~40 LOC) was prototyped and works: activemodel
reaches 57/57 `rubyFiles`, 969 `rubyTests`.

The gate is the assertion ratchet. The six materialized Ruby tests carry their
mixin bodies' assertions (2, 2, 2, 2, 7, 2), while the faithful TS mirror of
`lint_test.rb` delegates to the ported `Lint::Tests` functions in `lint.ts` and
so extracts ZERO assertions — `extract-ts-core.ts` folds only SAME-FILE
helpers, not imported ones. Enrolling therefore raises activemodel's
assertion-count mismatch by 6 against the committed mark in
`scripts/test-compare/assertion-mismatch-mark.json`, and `assertion-ratchet.ts`
is only-shrink. The mark has since been tightened from 286 to 281, so the
headroom is smaller than when this was first diagnosed, not larger.

Shipping the extractor change alone is worse than not shipping it: the six
tests land unmatched and activemodel's `parity:test` percentage drops from 100%
to 99.4%, a negative delta.

Enrollment gotcha: test-compare enrollment needs its four registrations —
assertion-mismatch marks can red CI with a green local compare.

## Unblocking route

Exactly one of these has to land first:

- **Cross-file helper folding in the TS assertion extractor** — teach
  `extract-ts-core.ts` to fold assertions out of imported helpers, so the TS
  mirror scores the six assertions its Ruby counterpart does. This is the real
  fix and it generalizes beyond lint.
- **Or converge six-plus of activemodel's existing assertion-count mismatches
  first**, making room under the mark, then enroll in the same PR.

## Acceptance criteria

- activemodel `rubyFiles` reaches 57/57 with `cases/lint_test.rb` mapped and
  its six tests matching.
- `pnpm parity:test` delta non-negative.
- The activemodel `assertionCount` mark in
  `scripts/test-compare/assertion-mismatch-mark.json` is not raised; tightened
  downward only if touched.
