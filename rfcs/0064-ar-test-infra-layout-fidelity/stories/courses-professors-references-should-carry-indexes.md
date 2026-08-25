---
title: "courses-professors-references-should-carry-indexes"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5689
claim: "2026-07-30T23:39:17Z"
assignee: "courses-professors-references-should-carry-indexes"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/schema/schema.rb:1457-1460` declares
`courses_professors` with `t.references :course` and `t.references :professor`.
`references` defaults to `index: true`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb`,
`ReferenceDefinition#initialize` — `index: true`), so Rails creates an index on
each of the two columns.

trails declares neither index. Both declaration sites spell the columns as bare
integers with no index:

- `packages/activerecord/src/support/canonical-schema.ts` —
  `define("courses_professors", { id: false, arunit2: true }, ...)` emits
  `t.integer("course_id")` / `t.integer("professor_id")`.
- `packages/activerecord/src/test-helpers/test-schema.ts` — the
  `courses_professors` entry in `ARUNIT2_SCHEMA` has `columns` and
  `primaryKey: false`, no `indexes`.

Found during review of PR #5685 (arunit2-tables-should-leave-the-primary-schema),
which only added the `arunit2: true` flag to this table — the missing indexes
predate it and were left alone there to keep that PR scoped.

## Acceptance criteria

- `courses_professors` carries an index on `course_id` and one on
  `professor_id`, matching what `t.references` emits in Rails.
- Both declaration sites change together (`canonical-schema.ts` and
  `test-schema.ts`'s `ARUNIT2_SCHEMA`), per the two-schema-sources rule.
- The index names match what Rails' `references` would generate for this table.
