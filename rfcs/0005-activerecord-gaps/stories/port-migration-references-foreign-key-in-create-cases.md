---
title: "port-migration-references-foreign-key-in-create-cases"
status: done
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5482
claim: "2026-07-28T02:04:16Z"
assignee: "port-migration-references-foreign-key-in-create-cases"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/migration/references_foreign_key_test.rb:6-106`
holds `ActiveRecord::Migration::ReferencesForeignKeyInCreateTest`, the sibling
class of `ReferencesForeignKeyTest`. PR for
`port-migration-references-foreign-key-cases` ported 9 of the 23 cases in the
file (the `ReferencesForeignKeyTest` class' create/change/remove cases) into
`packages/activerecord/src/migration/references-foreign-key.test.ts`;
`test:compare` now reports `9 OK / 14 missing` for the file.

This story covers the 9 `ReferencesForeignKeyInCreateTest` cases:

- foreign keys can be created with the table
- no foreign key is created by default
- foreign keys can be created in one query when index is not added
- options hash can be passed
- to_table option can be passed
- deferrable: false option can be passed
- deferrable: :immediate option can be passed
- deferrable: :deferred option can be passed
- deferrable and on\_(delete|update) option can be passed

The last four are Ruby-guarded by
`ActiveRecord::Base.lease_connection.supports_deferrable_constraints?` — mirror
that with the trails `supportsX` gate helper (`support/supports.ts`) rather than
an adapter-name check.

Add a second `describe("ReferencesForeignKeyInCreateTest", ...)` block inside
the existing `describeIfSupports("foreign_keys", "Migration", ...)` in
`packages/activerecord/src/migration/references-foreign-key.test.ts`, and reuse
the `withTestingTables` helper already in that file.

## Acceptance criteria

- [ ] All 9 `ReferencesForeignKeyInCreateTest` cases live under the describe
      path `Migration > ReferencesForeignKeyInCreateTest`.
- [ ] Test names match Rails verbatim.
- [ ] Deferrable cases gated on `supports_deferrable_constraints`.
- [ ] `pnpm test:compare --package activerecord` shows
      `migration/references_foreign_key_test.rb` missing drop from 14 to 5;
      `--gates --check` exits 0.
