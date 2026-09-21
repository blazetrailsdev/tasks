---
title: "Port explain with eager loading to the MySQL and PostgreSQL explain suites"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: trails#7930
claim: "2026-09-21T13:41:59Z"
assignee: "assert-helper-only-tests-trip-the-missing-assertions-guard"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the abstract_mysql_adapter assertion tail
(trails#7905). `pnpm parity:test -- --package activerecord --missing` reports
one unported test in BOTH explain suites, under the same Rails name:

```text
adapters/abstract_mysql_adapter/mysql_explain_test.rb  ... 4 OK, 1 Miss, 7 Extra
    - explain with eager loading
adapters/postgresql/explain_test.rb                    ... 4 OK, 1 Miss, 5 Extra
    - explain with eager loading
```

### Rails source

`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/mysql_explain_test.rb:17-22`:

```ruby
def test_explain_with_eager_loading
  explain = Author.where(id: 1).includes(:posts).explain.inspect
  assert_match %(EXPLAIN SELECT `authors`.* FROM `authors` WHERE `authors`.`id` = 1), explain
  assert_match %r(authors |.* const), explain
  assert_match %(EXPLAIN SELECT `posts`.* FROM `posts` WHERE `posts`.`author_id` = 1), explain
  assert_match %r(posts |.* ALL), explain
end
```

The PostgreSQL twin is `vendor/rails/activerecord/test/cases/adapters/postgresql/explain_test.rb`,
same test name, same shape with PG's quoting and plan text.

Note this is distinct from `test_explain_options_with_eager_loading`, which
IS ported (trails#7905 converged its assertions) — the plain no-options
eager-loading test is the missing one.

### Converged shape

A sibling in the same `describe("MySQLExplainTest")` block, placed in Rails'
member order (between `explain for one query` and
`explain with options as symbol`), with the four `assert_match` calls above
ported as four `expect(explain).toMatch(...)`. trails#7905's
`explain for one query` in
`packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts`
is the pattern to copy, including `Author.where({ id: 1 })` and
`.includes(":posts")`.

Both files already carry the fixtures (`authors`, `authorAddresses`, `posts`)
and the registered `Author` / `Post` models the test needs, so this is test
code only — no production change is expected.

## Acceptance criteria

- [ ] `explain with eager loading` exists in
      `packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts`
      with the four `match` assertions Rails makes.
- [ ] The same test exists in
      `packages/activerecord/src/adapters/postgresql/explain.test.ts`, ported
      from that suite's own Rails counterpart.
- [ ] `pnpm parity:test -- --package activerecord --missing` reports 0 Miss for
      both `mysql_explain_test.rb` and `postgresql/explain_test.rb`.
- [ ] Both report 0 assertion-count/kind/value mismatches under
      `pnpm parity:test -- --package activerecord --assertions`.
- [ ] Test names verbatim from Rails; no rename.
