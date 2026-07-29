---
title: "view-insert-returning-gate-excludes-mysql"
status: ready
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5585 makes `support/supports.ts`'s `insert_returning` entry live-derived
(MariaDB >= 10.5) instead of a static `adapterType` table. That correctly stops
the MySQL-family lane from skipping insert-returning tests — but it also arms
one test that Rails never runs on the MySQL family, leaving it failing on the
MariaDB CI lane:

`packages/activerecord/src/view.test.ts` — `UpdateableViewTest > "insert record
populates primary key"` fails with `expected 0 to be greater than 0`.

Verified by applying #5585's diff onto `origin/main` and running against a local
`mariadb:11` (11.8.6) container matching the CI service:

```text
ARCONN=mysql2 pnpm vitest run packages/activerecord/src/view.test.ts
  x UpdateableViewTest > insert record populates primary key
    -> expected 0 to be greater than 0
```

This is not a gap in #5585's adapter work — it is a wrong gate in the trails
port, previously masked by the static supports table.

Rails gates the test off the MySQL family by name
(`vendor/rails/activerecord/test/cases/view_test.rb:197`):

```ruby
def test_insert_record_populates_primary_key
  book = PrintedBook.create! name: "Rails in Action", status: 0, format: "paperback"
  assert_not_nil book.id
  assert book.id > 0
end if current_adapter?(:PostgreSQLAdapter, :SQLite3Adapter) && supports_insert_returning?
```

The trails port at `packages/activerecord/src/view.test.ts:263-269` carries
`itIfSupports.skipIf(adapterType === "sqlite")("insert_returning,views", ...)`
with a comment asserting Rails "runs on mysql + postgresql". That is wrong on
both counts — Rails names PostgreSQL and SQLite3 and excludes MySQL.

Rails' exclusion is well founded. A MariaDB view reports no `auto_increment`
Extra for the base table's key, so the column is never auto-populated, no
RETURNING column is requested, and `LAST_INSERT_ID()` through a view is 0:

```text
MariaDB> SHOW FULL FIELDS FROM v_t;
Field  Type     ...  Key  Default  Extra
id     int(11)  ...       0                 <- no auto_increment
MariaDB> SELECT LAST_INSERT_ID();
0
```

MariaDB does support `INSERT ... RETURNING` into a view (confirmed directly), so
this is specifically the auto-populated-column detection, not a RETURNING gap.

## Acceptance criteria

- `view.test.ts`'s "insert record populates primary key" is gated off the MySQL
  family, matching `current_adapter?(:PostgreSQLAdapter, :SQLite3Adapter) &&
supports_insert_returning?` at `view_test.rb:197`.
- The misleading comment claiming Rails runs the test on mysql is corrected.
- The `insert_returning,views` feature list is preserved so the test:compare
  gate extractor still reconciles `view_test.rb`.
- The test is NOT renamed.
- Green on the MariaDB lane, with PostgreSQL and SQLite unchanged.

## Notes

The fix is a two-line gate change; it was implemented and verified in PR #5594,
which was closed as a duplicate of #5585 (the two PRs converged independently on
the same adapter fix). The view gate was the one piece #5585 does not carry.
Reference implementation:

```ts
itIfSupports.skipIf(adapterType === "sqlite" || adapterType === "mysql")(
  "insert_returning,views",
  "insert record populates primary key",
  ...
```

Depends on #5585 merging first (the failure only surfaces once
`insert_returning` is live-derived), but the change itself touches only
`view.test.ts` and conflicts with nothing in #5585.
