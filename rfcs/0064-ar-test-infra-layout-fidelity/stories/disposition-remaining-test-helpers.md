---
title: "Disposition the remaining test-helpers/ files (bucket D)"
status: done
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: ["move-test-helpers-to-support-dir"]
deps-rfc: []
est-loc: 300
priority: 60
pr: 5403
claim: "2026-07-27T13:17:08Z"
assignee: "disposition-remaining-test-helpers"
blocked-by: null
closed-reason: null
---

## Context

This RFC's README dispositions every file in `packages/activerecord/src/test-helpers/` into four
buckets. `move-test-helpers-to-support-dir` handles B and C; bucket A stays.
This story resolves **bucket D** — files whose destination could not be settled
from the Rails source without further verification:

- **Fixtures machinery**: `fixtures.ts`, `fixture-set.ts`, `define-fixtures.ts`,
  `fixtures-registry.ts`, `use-fixtures.ts`, `with-transactional-fixtures.ts`,
  `use-transactional-tests.ts`. Rails' counterparts are
  `activerecord/lib/active_record/fixtures.rb`,
  `lib/active_record/fixture_set/`, and `lib/active_record/test_fixtures.rb` —
  **library** code, not `test/support/`. trails already has a top-level
  `packages/activerecord/src/test-fixtures.ts`. So some of these are probably
  misfiled library code that belongs at `src/` level under its Rails name, not
  test infrastructure at all.
- `in-time-zone.ts` — Rails' `InTimeZone` is a module defined _inside_
  `test/cases/helper.rb:66-79` (within `class ActiveRecord::TestCase`), so it
  may belong in `cases/helper.ts` rather than `support/`.
- `protected-params.ts`, `repair-validations.ts` — Rails counterpart not yet
  located; may live in `test/cases/` or in ActiveModel's test tree.

## Acceptance criteria

- For each bucket-D file, locate its Rails counterpart with `pnpm rails:find`
  and a direct read of `vendor/rails/`, and record the `file:line` in the PR
  body. If there is genuinely no counterpart, say so explicitly and leave the
  file in `support/` with its invented name.
- Move each file to the location its Rails counterpart implies. Library code
  (the `fixtures.rb` / `test_fixtures.rb` family) goes to `src/` under its Rails
  name — check first whether `src/test-fixtures.ts` already holds it, in which
  case the finding is a duplicate to converge rather than a file to move.
- `in-time-zone.ts`: fold into `cases/helper.ts` only if it really is
  `helper.rb`'s `InTimeZone`; a separate file is acceptable if folding it in
  would misrepresent the boundary — justify either way at the call site.
- Do NOT rename any test. `pnpm schema:compare` / `pnpm fixtures:compare` output
  must be unchanged.
- Depends on `move-test-helpers-to-support-dir`.
