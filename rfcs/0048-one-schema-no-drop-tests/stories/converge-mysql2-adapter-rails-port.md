---
title: "converge-mysql2-adapter-rails-port"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Faithful Rails port (RFC 0048 convergence contract). Mirror
`vendor/rails/activerecord/test/cases/adapters/mysql2/mysql2_adapter_test.rb`
(354 lines) word-for-word into
`packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts` (currently
562 lines, trails-invented describe/it names + hand-rolled assertions). Ride
canonical TEST_SCHEMA + official models/fixtures; Rails' own scratch-table
names only. No bespoke tables, no `_tableName` paint-over of a bespoke suite.

Split from converge-mysql-adapter-ddl-one-schema (the schema.test.ts portion
shipped separately under the 500-LOC ceiling).

## Acceptance criteria

- [ ] describe/it names match the Rails test method names verbatim.
- [ ] Setup/fixtures/assertions reproduce the Rails bodies, not paraphrase.
- [ ] Ride canonical TEST_SCHEMA + test-helpers/models/\* + real fixtures.
- [ ] Surfaced impl gaps: fix impl or file under 0023-surfaced-deviations
      (tracked-pending-convergence); do not bend the test.
- [ ] All-or-nothing in one PR, <500 LOC.
