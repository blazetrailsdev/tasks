---
title: "activemodel: cases/lint_test.rb and serializers/json_serialization_test.rb sit outside the test-compare population"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: test-placement
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
