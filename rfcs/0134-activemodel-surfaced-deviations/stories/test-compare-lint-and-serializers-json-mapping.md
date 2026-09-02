---
title: "activemodel: cases/lint_test.rb and serializers/json_serialization_test.rb sit outside the test-compare population"
status: blocked
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: test-placement
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: 50
pr: null
claim: "2026-09-02T22:05:40Z"
assignee: "type-value-split-and-name-property-burndown"
blocked-by: "The serializers half is already satisfied on main: cases/serializers/json_serialization_test.rb IS in the compare population and matches packages/activemodel/src/serializers/json-serialization.test.ts, so activemodel already sits at 56/56 files matched. The lint half is blocked by an only-shrink gate. cases/lint_test.rb (vendor/rails/activemodel/test/cases/lint_test.rb:5) defines no test methods at all — its body is 'include ActiveModel::Lint::Tests' and a CompliantModel, and the six tests live in activemodel/lib/active_model/lint.rb:31-107, outside every scanned test dir. Teaching extract-ruby-tests.rb to walk that lib file (an EXTERNAL_TEST_MIXINS map re-keying the collected module under the constant path the include spells, ~40 LOC) was prototyped and works: activemodel reaches 57/57 rubyFiles, 969 rubyTests. But the six materialized Ruby tests carry their mixin bodies' assertions (2, 2, 2, 2, 7, 2), while the faithful TS mirror of lint_test.rb delegates to the ported Lint::Tests functions in lint.ts and so extracts ZERO assertions — extract-ts-core.ts folds only SAME-FILE helpers, not imported ones. Enrolling therefore raises activemodel's assertion-count-mismatch from 284 to 290 against a committed mark of 286 (scripts/test-compare/assertion-mismatch-mark.json), and assertion-ratchet.ts is only-shrink, so the mark cannot be raised to admit it. Unblocking needs one of: cross-file helper folding in the TS assertion extractor, or converging six-plus of activemodel's existing count mismatches first to make room. Shipping the extractor change alone is worse than not shipping it — the six tests land unmatched and activemodel's parity:test percentage drops 100 percent to 99.4 percent, a negative delta."
closed-reason: null
---

## Context

`pnpm parity:test` counts 56 activemodel `rubyFiles` while
`vendor/rails/activemodel/test` holds 57 `*_test.rb`. The diff is
`cases/lint_test.rb` — excluded from the compare population even though
`packages/activemodel/src/lint.test.ts` exists. Separately,
`packages/activemodel/src/serializers/json.test.ts` is unmapped: Rails' file
is `test/cases/serializers/json_serialization_test.rb`, whose name the
convention mapping (`json_serialization_test.rb` → `json-serialization.test.ts`?)
does not produce from `json.test.ts`.

Fix in `scripts/test-compare` / `scripts/parity/conventions.ts` (path aliases
live in `PATH_SEGMENT_ALIASES` / `RUBY_FILE_TS_OVERRIDES`), or rename the TS
test FILE (renaming files is fine; test NAMES must never change). Enrollment
gotcha: test-compare enrollment needs its registrations (see the
`test_compare_enrollment_needs_four_registrations` memory — assertion-mismatch
marks can red CI with a green local compare).

## Acceptance criteria

- activemodel `rubyFiles` reaches 57/57 with both files mapped and their tests
  matching.
- `pnpm parity:test` delta non-negative; assertion-mismatch marks tightened
  only downward if touched.
