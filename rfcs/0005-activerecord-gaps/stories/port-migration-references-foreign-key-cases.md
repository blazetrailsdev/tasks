---
title: "Port ActiveRecord::Migration::ReferencesForeignKeyTest"
status: claimed
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-07-28T01:52:16Z"
assignee: "port-migration-references-foreign-key-cases"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/migration/references_foreign_key_test.rb`
is fully unported: `test:compare --package activerecord` reports
`migration/references_foreign_key_test.rb -> migration/references-foreign-key.test.ts
0 OK / 23 missing (marked X)`. Surfaced while working on
`fix-foreign-key-test-describe-path` (PR #5457), which fixed the describe path
of the neighbouring `foreign_key_test.rb` suite.

The Ruby class is `ActiveRecord::Migration::ReferencesForeignKeyTest`, so the
TS file needs the same two-level shape PR #5457 established for its sibling:
`describeIfSupports("foreign_keys", "Migration", ...)` >
`describe("ReferencesForeignKeyTest", ...)`. See
`packages/activerecord/src/migration/foreign-key.test.ts` for the pattern and
for the `ambientConnection` / `withRocketTables` setup idiom.

23 cases is likely more than one PR at the 500 LOC ceiling — split by Rails
method group and register the remainder as follow-up stories rather than
fanning out.

## Acceptance criteria

- [ ] `packages/activerecord/src/migration/references-foreign-key.test.ts`
      exists with the two-level describe path `Migration > ReferencesForeignKeyTest`.
- [ ] Test names match Rails verbatim.
- [ ] Canonical schema/models only — no bespoke tables.
- [ ] `pnpm test:compare --package activerecord` shows the
      `migration/references_foreign_key_test.rb` missing count drop by the
      number ported; `--gates --check` exits 0.
