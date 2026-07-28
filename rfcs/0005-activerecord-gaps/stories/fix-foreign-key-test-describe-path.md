---
title: "fix-foreign-key-test-describe-path"
status: done
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5457
claim: "2026-07-27T21:16:16Z"
assignee: "fix-foreign-key-test-describe-path"
blocked-by: null
closed-reason: null
---

## Context

Unskipping `vendor/rails/activerecord/test/cases/migration/` in
`scripts/test-compare/extract-ruby-tests.rb` (story
`unskip-migration-dir-in-test-compare`) made the directory's ported suites
visible to `test:compare`. All 11 `ForeignKeyTest` cases in
`packages/activerecord/src/migration/foreign-key.test.ts` match, but land in
the "wrong describe" bucket: Ruby's ancestor path is
`Migration > ForeignKeyTest` (the extractor drops the outer `ActiveRecord`
module — see `output/rails-tests.json`, `migration/foreign_key_test.rb`),
while the TS file uses one flat
`describeIfSupports("foreign_keys", "ActiveRecord::Migration::ForeignKeyTest", ...)`.

The sibling suites `unique-constraint.test.ts` and
`exclusion-constraint.test.ts` were already nested and were corrected to
`describeIfSupports(<feature>, "Migration", ...)` + inner
`describe("UniqueConstraintTest"/"ExclusionConstraintTest")` in that PR. Only
foreign-key was left, because splitting its single describe into two levels
reindents the whole ~220-line file and would have blown the 500 LOC ceiling.

## Acceptance criteria

- [ ] `foreign-key.test.ts` nests `describeIfSupports("foreign_keys", "Migration", ...)`
      around an inner `describe("ForeignKeyTest", ...)`, so the TS path is
      `Migration > ForeignKeyTest`.
- [ ] `pnpm test:compare --package activerecord` reports 0 wrong-describe for
      `migration/foreign_key_test.rb` (activerecord total drops from 11 to 0).
- [ ] Test names are unchanged; `pnpm vitest run packages/activerecord/src/migration/foreign-key.test.ts` still passes.
