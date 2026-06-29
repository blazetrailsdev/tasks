---
title: 'Add local it("update") in callbacks.test.ts mirroring Rails test_update'
status: claimed
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-29T13:34:13Z"
assignee: "callbacks-local-update-test-coverage"
blocked-by: null
---

## Context

Rails `vendor/rails/activerecord/test/cases/callbacks_test.rb` defines
`test_update`, exercising the create-vs-update callback firing path. The
trails convention file `packages/activerecord/src/callbacks.test.ts` has **no
local `it("update")`** — `test:compare` keeps `missing=0` only because the name
matches a _shared_ test in another TS file via the cross-file (step-3) match in
`scripts/test-compare/test-compare.ts`. So the dedicated update-callback
behavior has no test living in its convention file.

Surfaced during the callbacks-extra-burndown (RFC 0043, PR #4133), which
removed 61 TS-only extras; this gap predates that PR and was left untouched.

## Acceptance criteria

- Add an `it("update")` to `callbacks.test.ts` that mirrors Rails
  `test_update` (read the Rails body first; match the test name verbatim).
- `matched` stays 21, `missing` stays 0, `extra` does not increase; the new
  test is the local convention-file match for `test_update`.
- Uses canonical tables / existing bespoke schema already in the file; no new
  bespoke tables.
