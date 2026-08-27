---
title: "abstract-mysql SchemaTest hand-inserts a posts row where Rails declares fixtures :posts"
status: draft
updated: 2026-08-27
rfc: "0105-ar-deps-test-parity-100"
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

Surfaced while landing `shield-removal-mysql-adapter-suites` (PR #7120).

Rails' `SchemaTest`
(`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/schema_test.rb:10`)
opens with a bare fixtures declaration:

```ruby
class SchemaTest < ActiveRecord::AbstractMysqlTestCase
  fixtures :posts
```

and `test_schema` (`:57-59`) is then a one-liner that reads what the fixture
load seeded:

```ruby
def test_schema
  assert @omgpost.first
end
```

trails'
`packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts`
has no `fixtures(...)` call at all. Its `"schema"` case hand-inserts the row
with raw SQL and deletes it again in a `finally`:

```ts
await adapter.executeMutation(
  "INSERT INTO `posts` (`title`, `body`, `type`) " +
    "VALUES ('Welcome to the weblog', 'Such a lovely day', 'Post')",
);
try {
  const first = await (OmgPost as any).first();
  expect(first).toBeTruthy();
} finally {
  await adapter.executeMutation("DELETE FROM `posts` WHERE `title` = 'Welcome to the weblog'");
}
```

PR #7120 removed this file's `createTable`/`dropTable` of canonical `posts`
and `topics` and its `rebuildCanonicalTables` restore helper, so the suite now
rides the boot-laid canonical schema. The hand-rolled row is the last piece of
the old shape left: the suite still provisions its own data instead of
declaring the fixture Rails declares, and the manual DELETE exists only
because nothing wraps the case in the transactional-fixture pin.

## Converged shape

`fixtures(["posts"])` at the `describe("SchemaTest")` scope, mirroring
`schema_test.rb:10`, with `"schema"` reduced to the bare
`expect(await OmgPost.first()).toBeTruthy()` of `:57-59` — no INSERT, no
DELETE, rollback handled by the fixture pin.

## Watch out for

- **`fixtures(...)` arms `blazetrails/test-fixture-parity` for the whole
  describe.** Every sibling case in `SchemaTest` whose Rails counterpart uses
  fixtures but whose TS body calls no fixture accessor starts reporting. Check
  the cost with `pnpm exec eslint <file>` before committing; converting the
  siblings may be the bulk of the work.
- **This suite does DDL.** `"float limits"` creates and drops `mysql_doubles`,
  and `"drop temporary table"` runs DDL inside a transaction. MySQL's DDL
  implicit commit escapes the transactional-fixture pin, so those cases need
  `usesTransaction: [...]` — see the same treatment in
  `dirty.test.ts`'s `fixtures([], { usesTransaction: ["field named field"] })`.
- The file is MySQL-only (`describeIfMysqlAdapter`), so a sqlite run proves
  nothing here; verify on MySQL and MariaDB.

## Acceptance criteria

- [ ] `describe("SchemaTest")` declares `fixtures(["posts"])`, mirroring
      `schema_test.rb:10`.
- [ ] `"schema"` is the bare read of `schema_test.rb:57-59` — no INSERT and no
      DELETE in the test body.
- [ ] Any sibling case newly reported by `blazetrails/test-fixture-parity` is
      converted rather than suppressed.
- [ ] Green on MySQL and MariaDB co-scheduled with the full AR suite.
- [ ] No test renames; `parity:test` delta non-negative.
