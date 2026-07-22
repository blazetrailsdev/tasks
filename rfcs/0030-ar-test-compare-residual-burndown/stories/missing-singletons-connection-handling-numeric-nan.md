---
title: "missing-singletons-connection-handling-numeric-nan"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare` (2026-07-22) reports two remaining single missing tests:

- `connection-handling.test.ts` — "common APIs don't permanently hold a
  connection when permanent checkout is deprecated or disallowed"
  (vendor/rails/activerecord/test/cases/connection_handling_test.rb:171).
  Exercises lease semantics of with_connection-style APIs; relates to the
  with_connection shim (see prevent-permanent shim in connection handling).
- `numeric-data.test.ts` — "numeric fields with nan"
  (vendor/rails/activerecord/test/cases/numeric_data_test.rb:73). NaN write/read
  round-trip on numeric columns.

trails files: `packages/activerecord/src/connection-handling.test.ts`,
`packages/activerecord/src/numeric-data.test.ts` (tests absent).

## Acceptance criteria

- [ ] Both tests ported (names verbatim) and matched in `test:compare`, or
      it.skip with recorded BLOCKED reason + follow-up story.
- [ ] Missing count for both files drops to 0.
