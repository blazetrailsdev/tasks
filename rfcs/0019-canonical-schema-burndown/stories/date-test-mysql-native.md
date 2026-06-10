---
title: "date.test.ts → date_test.rb canonical port + native MySQL date columns"
status: draft
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 120
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of `attribute-types-cluster` (PR #3100) after a MySQL CI failure.

`date.test.ts` → `date_test.rb` cannot ride the canonical `Topic` model on
MySQL as-is: the `assign valid dates` multiparameter test needs `last_read` to
resolve to the AR `date` type, but `defineSchema` deliberately maps MySQL
`date` → VARCHAR (`test-helpers/define-schema.ts` `COLUMN_TYPE_MAP_MYSQL`,
line ~205, with `time`/`json` likewise). So the reflected column is
`varchar(255)`, the model attribute resolves to a string type, and
`topic.last_read.equals(...)` throws `is not a function`. The pre-migration
inline test only worked because it declared `this.attribute("last_read","date")`
explicitly — which the canonical `Topic` (faithfully) does not.

## Scope

1. Make MySQL `date` columns native (`COLUMN_TYPE_MAP_MYSQL.date = "date"`).
   Verified locally: flipping this makes `date.test.ts` pass on MariaDB and the
   canonical `Topic.last_read` reflects as `date`. This is a shared-helper
   change — run the **full** AR suite on MySQL (CI) to check blast radius across
   every date-column test before merging. Consider `time`/`json` separately
   (leave them string unless needed).
2. Migrate `date.test.ts` onto canonical `Topic` + `TEST_SCHEMA.topics`
   (`last_read` date), Rails-verbatim bodies (`Topic.create`/`find_by` + id
   equality for `assert_equal record, find_by`; multiparameter `last_read(Ni)`
   for `assign valid dates`). Remove from `require-canonical-schema-exclude.json`.

## Acceptance criteria

- [ ] MySQL `date` columns are native DATE; full AR MySQL suite stays green.
- [ ] `date.test.ts` rides canonical `Topic` + `TEST_SCHEMA`; bodies match
      `date_test.rb` word-for-word; names unchanged.
- [ ] `pnpm vitest run` passes on all adapters; zero `require-canonical-schema`
      errors; file removed from the exclude JSON.
