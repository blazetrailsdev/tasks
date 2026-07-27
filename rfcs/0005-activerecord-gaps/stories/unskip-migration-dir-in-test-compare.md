---
title: "unskip-migration-dir-in-test-compare"
status: done
updated: 2026-07-27
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5451
claim: "2026-07-27T20:41:54Z"
assignee: "unskip-migration-dir-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb:45-53` has a `SKIP_PATTERNS` entry
`/\/migration\//` commented "Migration test infrastructure (not test cases
themselves)". That is wrong: `vendor/rails/activerecord/test/cases/migration/`
is a directory of ~20 real test files (`foreign_key_test.rb`,
`column_attributes_test.rb`, `change_schema_test.rb`, `index_test.rb`,
`references_foreign_key_test.rb`, …) holding several hundred `def test_*`
cases. The Rails-side _infrastructure_ file is
`test/cases/migration_test.rb`'s helpers plus `test/support/`, not this dir.

Consequence: every test ported out of that directory is invisible to
`test:compare` — it lands in the "extra (TS only)" bucket instead of counting
as a matched pair, and the missing cases never show as missing. This was found
while shipping `port-migration-foreign-key-add-cases` (PR that adds
`packages/activerecord/src/migration/foreign-key.test.ts`): the story's
acceptance criterion "test:compare delta for foreign_key_test.rb is strictly
positive" was unsatisfiable because the file is not in the manifest at all.

Expect a large one-time drop in the reported overall percentage when the
pattern is removed — those tests were always missing, just unmeasured. The
`activerecord` file count goes from 342 to ~362.

## Acceptance criteria

- [ ] The `/\/migration\//` entry is removed from `SKIP_PATTERNS` (or narrowed
      to whatever genuinely-infrastructure file motivated it, with the reason
      spelled out in the comment).
- [ ] `pnpm test:compare --package activerecord` lists
      `migration/foreign_key_test.rb` and its siblings, and matches the already
      ported cases in `packages/activerecord/src/migration/` (foreign-key.test.ts,
      join-table.test.ts, command-recorder.test.ts) rather than reporting them
      as TS-only extras.
- [ ] Any ratchet/threshold that the new baseline trips is updated in the same
      PR so CI is green.
