---
title: "Rewire Contact/ContactSti onto the registered fake adapter"
status: done
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5520
claim: "2026-07-28T15:53:15Z"
assignee: "rewire-contact-model-onto-fake-adapter"
blocked-by: null
closed-reason: null
---

## Context

PR #5401 ported `FakeActiveRecordAdapter` to
`packages/activerecord/src/support/fake-adapter.ts` and registered it under
`"fake"` from `packages/activerecord/src/cases/helper.ts` (mirroring
`vendor/rails/activerecord/test/cases/helper.rb:46`). The adapter is real and
tested but has **no production consumer** — nothing in trails currently calls
`establish_connection(adapter: "fake")`.

Rails' consumer is `vendor/rails/activerecord/test/models/contact.rb`:

- `contact.rb:4-8` — `ContactFakeColumns.extended(base)` runs
  `establish_connection(adapter: "fake")`, then sets
  `lease_connection.data_sources = [table_name]` and
  `lease_connection.primary_keys = { table_name => "id" }`.
- `contact.rb:10-18` — eight `column :name, "type"` calls.
- `contact.rb:28-30` — `def column(name, sql_type = nil, options = {})` delegates
  to `lease_connection.merge_column(table_name, name, sql_type, options)`.
- `contact.rb:38-42` — `ContactSti` extends the same module, adds
  `column :type, "string"`, and overrides `def type; "ContactSti" end`.

trails' `packages/activerecord/src/test-helpers/models/contact.ts` instead
declares the synthetic columns with `klass.attribute(...)` in a local
`declareContactColumns()` helper, with a comment stating "The fake adapter
infrastructure is not ported". That comment is now stale — it is ported.

Note the trap: `attribute()` suppresses DB reflection, so the current shape is
not merely a stylistic deviation; it changes which code path supplies the column
set.

## Acceptance criteria

- `contact.ts` obtains its columns through the registered `"fake"` adapter
  (`establishConnection({ adapter: "fake" })` + `mergeColumn`), not through
  `klass.attribute(...)`.
- `dataSources` / `primaryKeys` are set on the leased fake connection the way
  `contact.rb:6-8` does.
- `ContactSti` keeps its `type` override and rides the same module-equivalent
  path as `Contact`, matching `contact.rb:38-42`.
- Drop the stale "fake adapter infrastructure is not ported" comment.
- `json-serialization.test.ts` (JsonSerializationTest + the `Contact` suite)
  stays green; no test renames.
