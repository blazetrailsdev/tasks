---
title: "Four finder_test.rb find_by_sql/find tests are placeholder bodies with a local Topic and invented quoting"
status: draft
updated: 2026-09-10
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four `packages/activerecord/src/finder.test.ts` tests carry the Rails names but have placeholder bodies. Each declares a local `class Topic extends Base` with an inline `title` attribute, creates one row, and runs `Topic.findBySql('SELECT * FROM "topics"')` with a weakened assertion (`toBeGreaterThanOrEqual(0)`, `Array.isArray`). The double-quoted identifier only works on MySQL because of the trails-only `mysqlQuote` rewrite (see `mysql-quote-retirement-needs-hand-written-double-quoted-sql-converged`).

The Rails bodies (`vendor/rails/activerecord/test/cases/finder_test.rb`) use fixtures and the canonical models:

- `test_find_with_string` (`:186-188`): `assert_equal(Topic.find(1).title, Topic.find("1").title)`
- `test_find_with_entire_select_statement` (`:717-724`): `Topic.find_by_sql "SELECT * FROM topics WHERE author_name = 'Mary'"`, asserting size 1, `topics(:second).title`, and the `async_find_by_sql` equality
- `test_find_with_prepared_select_statement` (`:726-731`): `Topic.find_by_sql ["SELECT * FROM topics WHERE author_name = ?", "Mary"]`, asserting size 1 and `topics(:second).title`
- `test_find_by_sql_with_sti_on_joined_table` (`:733-736`): `Account.find_by_sql("SELECT * FROM accounts INNER JOIN companies ON companies.id = accounts.firm_id")`, asserting `[Account]` classes

## Acceptance criteria

- [ ] All four bodies use the canonical `Topic` / `Account` models and `fixtures({ ... })`, with no local model class.
- [ ] SQL literals and assertions match Rails line for line, including the async half of `test_find_with_entire_select_statement`.
- [ ] Green on SQLite, PostgreSQL, MySQL 8 and MariaDB.
