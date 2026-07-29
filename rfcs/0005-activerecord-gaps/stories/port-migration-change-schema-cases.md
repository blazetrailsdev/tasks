---
title: "Port the remaining ActiveRecord::Migration::ChangeSchemaTest cases"
status: claimed
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: "2026-07-29T01:35:45Z"
assignee: "port-migration-change-schema-cases"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/migration/change-schema.test.ts` was created by
PR #5547 to give the relocated `change column null` case its Rails-matching
home. It holds only that one; `test:compare` reports **34 missing** for
`vendor/rails/activerecord/test/cases/migration/change_schema_test.rb`.

The file already carries a `SilentMigration` (Rails' `suppress_messages`),
the `testingTableWithOnlyFooAttribute` helper (`change_schema_test.rb:489-495`)
and the `testings` teardown mirroring `change_schema_test.rb:16-20`. Rails'
teardown also resets `ActiveRecord::Base.primary_key_prefix_type` and calls
`clear_cache!`, which the trails port does not yet do — check whether the
remaining cases need it.

Remaining cases start at `change_schema_test.rb:22` and include the
`create_table` id/primary-key family, `test_column_exists`, and the
`change_column_null` variants around :380-411. Note the sibling
`ChangeSchemaWithDependentObjectsTest` (:499+) is gated on
`supports_foreign_keys?` and belongs in the same file.

## Acceptance criteria

- [ ] The remaining `change_schema_test.rb` cases are ported under
      `Migration > ChangeSchemaTest` (and `> ChangeSchemaWithDependentObjectsTest`)
      with names matching Rails verbatim.
- [ ] `test:compare` missing count for `migration/change_schema_test.rb` drops
      accordingly; 0 gate-mismatch, 0 misplaced.
- [ ] Green on all three lanes.
- [ ] Split across PRs under the 500-LOC ceiling if needed; register the
      remainder as sibling stories rather than fanning out PRs.
