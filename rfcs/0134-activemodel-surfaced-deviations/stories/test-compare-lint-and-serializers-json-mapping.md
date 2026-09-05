---
title: "activemodel: cases/lint_test.rb and serializers/json_serialization_test.rb sit outside the test-compare population"
status: blocked
updated: 2026-09-05
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
blocked-by: "Scope is now the lint half only; the serializers half is already satisfied on main (cases/serializers/json_serialization_test.rb matches serializers/json-serialization.test.ts, activemodel 56/56 files). cases/lint_test.rb (vendor/rails/activemodel/test/cases/lint_test.rb:5) defines no test methods — its six tests live in lib/active_model/lint.rb:31-107, outside every scanned test dir. Teaching extract-ruby-tests.rb to walk that lib file was prototyped and reaches 57/57 rubyFiles, but the six materialized Ruby tests carry 2/2/2/2/7/2 assertions while the faithful TS mirror delegates to lint.ts and extracts ZERO (extract-ts-core.ts folds only same-file helpers), so enrolling raises activemodel's assertion-count mismatch by 6. The committed mark has since TIGHTENED from 286 to 281 (scripts/test-compare/assertion-mismatch-mark.json), so there is less headroom than at first diagnosis, and assertion-ratchet.ts is only-shrink. Unblocks on exactly one of: cross-file helper folding in the TS assertion extractor (the real fix, generalizes), or converging six-plus of activemodel's existing count mismatches first and enrolling in the same PR."
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
