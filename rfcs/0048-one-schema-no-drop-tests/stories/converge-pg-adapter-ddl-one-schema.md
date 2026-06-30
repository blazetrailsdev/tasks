---
title: "Converge PostgreSQL adapter DDL tests to ride one-schema"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 400
priority: 4
pr: null
claim: "2026-06-30T16:02:41Z"
assignee: "converge-pg-adapter-ddl-one-schema"
blocked-by: null
---

## Context

Per the RFC 0048 re-spec (2026-06-30), this story is a **faithful Rails test
port**, not a canonical-table rename. The earlier framing ("ride canonical
`TEST_SCHEMA`, match table/column names") let agents satisfy the letter with
shallow find-replace renames while keeping trails-invented test names and
assertions. That is rejected. Read the **Convergence contract** in the RFC 0048
README before starting — it is binding on this story.

Drop all `AR_ONE_SCHEMA` / `one-schema-exclude.json` framing: the no-`DROP TABLE`
performance mechanism moved to RFC `0000-one-schema-no-drop-perf`. This story is
fidelity-only.

## Acceptance criteria

- [ ] For each file below, the trails test mirrors its named Rails source
      **word-for-word as closely as TS allows**: same `describe`/`it` names,
      same setup/fixtures, same assertions. Test names are how `test:compare`
      maps to Rails — never invent or reword them.
- [ ] Ride canonical `TEST_SCHEMA` + official `test-helpers/models/*` + real
      fixtures only. No bespoke tables, no invented columns, and **no
      `_tableName` hack** to paint a canonical name onto a bespoke suite. If the
      canonical schema lacks something Rails' schema.rb has, add it to
      `TEST_SCHEMA`.
- [ ] Where a faithful port surfaces a trails impl gap, fix the impl to match
      Rails or file a deviation under `0023-surfaced-deviations` and mark the
      case tracked-pending-convergence. Do not bend the test to pass; a
      temporary `test:compare` regression is acceptable (record the un-skip).
- [ ] Confirm against the Rails source, not prior trails behavior. Split across
      PRs by file under the 500-LOC ceiling; each file converts all-or-nothing.

### Files → Rails source

- `packages/activerecord/src/adapters/postgresql/active-schema.test.ts` → mirror `vendor/rails/activerecord/test/cases/adapters/postgresql/active_schema_test.rb` (confirm it exists; if no 1:1 Rails file, the trails file is bespoke — delete it and port the Rails test cases that cover this behavior)
- `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts` → mirror `vendor/rails/activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb` (confirm it exists; if no 1:1 Rails file, the trails file is bespoke — delete it and port the Rails test cases that cover this behavior)
- `packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts` → trails-only extension — keep as-is unless it duplicates a Rails case; do NOT invent a Rails source
- `packages/activerecord/src/connection-adapters/postgresql-adapter.test.ts` → mirror `vendor/rails/activerecord/test/cases/connection_adapters/postgresql_adapter_test.rb` (confirm it exists; if no 1:1 Rails file, the trails file is bespoke — delete it and port the Rails test cases that cover this behavior)
