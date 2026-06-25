---
title: "Add UUID() else-branch to bulk_alter default-functions test for MariaDB"
status: ready
updated: 2026-06-25
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`migration.test.ts`'s `BulkAlterTableMigrationsTest > "default functions on
columns"` (converged in PR #4090) is gated `bulk_alter && text_column_with_default`
with no adapter restriction, matching Rails' feature-only gate
(migration_test.rb:1457). By Rails' own feature definitions that gate admits
MariaDB >= 10.2.1:

- `supports_bulk_alter?` is true for MySQL adapters (abstract_mysql_adapter.rb:96)
- `supports_text_column_with_default?` is true for any non-MySQL/Trilogy adapter,
  which includes MariaDB (adapter_helper.rb:42)

Rails branches in-body (migration_test.rb:1460-1469):

```ruby
if current_adapter?(:PostgreSQLAdapter)
  t.string :name, default: -> { "gen_random_uuid()" }
else
  t.string :name, default: -> { "UUID()" }
end
```

Our TS body hardcodes `gen_random_uuid()` and constructs a `PostgreSQLAdapter`
directly. The current CI matrix is mysql:8 (NOT MariaDB), so at runtime the
feature gate runs the test on Postgres only and the body is exact — there is no
failure today. This is a tracked-pending deviation (documented in-code at the
test's leading comment).

## Acceptance criteria

- [ ] If/when MariaDB joins the CI matrix, the test body branches like Rails:
      `gen_random_uuid()` on PostgreSQL, `UUID()` otherwise, using a
      backend-appropriate adapter rather than a hardcoded `PostgreSQLAdapter`.
- [ ] `default_function` assertion matches Rails (`gen_random_uuid()` on PG,
      `uuid()` on MariaDB).
- [ ] No test name change; gate stays feature-only
      (`bulk_alter && text_column_with_default`).
