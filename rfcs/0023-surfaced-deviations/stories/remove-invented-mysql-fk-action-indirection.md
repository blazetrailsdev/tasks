---
title: "Remove the invented _mysqlFkAction indirection in favour of the ported extractForeignKeyAction"
status: draft
updated: 2026-07-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `foreign_key_test.rb:267`
(`test_add_on_delete_restrict_foreign_key`) in PR #5307.

Rails models `extract_foreign_key_action` as a protected method on the abstract
adapter (`abstract/schema_statements.rb:1775`) that the MySQL mixin overrides:

```ruby
# mysql/schema_statements.rb:225
def extract_foreign_key_action(specifier)
  super unless specifier == "RESTRICT"
end
```

trails has BOTH the abstract version
(`abstract/schema-statements.ts:2473`, `extractForeignKeyAction`) and the MySQL
override (`connection-adapters/mysql/schema-statements.ts:311`) ported
correctly — but `AbstractMysqlAdapter` did not use either. It carried a third,
trails-invented copy, `_mysqlFkAction`
(`connection-adapters/abstract-mysql-adapter.ts:1060`), which returned
`"restrict"` and so reported `on_delete: :restrict` where Rails reports `nil`.

PR #5307 made `_mysqlFkAction` delegate to the ported override — the minimal fix
for the failing assertion — but left the invented indirection in place. It is
still a non-Rails method name threaded through a bound host object in
`mysql2-adapter.ts:1838-1845` purely to work around `protected` visibility, and
`mysql/schema-statements.ts:557` declares it in the `ForeignKeysHost` interface.

Additionally `connection-adapters/mysql/schema-statements.test.ts:34` stubs
`_mysqlFkAction` with an inline mapping that still returns `"restrict"` for
`"RESTRICT"` — the pre-fix behaviour — so the unit test's fake diverges from the
real adapter and would not catch a regression of this bug.

## Acceptance criteria

- [ ] `_mysqlFkAction` is removed; the FK-reading path calls the ported
      `extractForeignKeyAction` (Rails' name, in the Rails-layout file) directly,
      with the `ForeignKeysHost` interface and `mysql2-adapter.ts`'s bound host
      updated accordingly.
- [ ] The `fkHost` stub in `mysql/schema-statements.test.ts` uses the real
      `extractForeignKeyAction` rather than an inline mapping, so RESTRICT → nil
      is exercised there.
- [ ] `migration/foreign-key.test.ts`'s `add on delete restrict foreign key`
      still passes on MySQL (asserts `undefined`) and on PG/SQLite (asserts
      `"restrict"`).
