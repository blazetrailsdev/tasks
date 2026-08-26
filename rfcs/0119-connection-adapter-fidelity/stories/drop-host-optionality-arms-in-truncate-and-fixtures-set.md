---
title: "Call disableReferentialIntegrity/executeBatch unconditionally in truncateTables and insertFixturesSet"
status: draft
updated: 2026-08-26
rfc: "0119-connection-adapter-fidelity"
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

`truncateTables` and `insertFixturesSet`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`)
guard three collaborators that Rails calls unconditionally, so each ported body
carries branches with no Ruby counterpart:

```ts
const exec = this.execute ?? execute;
const doTruncate = async () => {
  if (this.executeBatch) {
    await this.executeBatch(statements, "Truncate Tables");
  } else {
    for (const stmt of statements) await exec.call(this, stmt);
  }
};
if (this.disableReferentialIntegrity) {
  await this.disableReferentialIntegrity(doTruncate);
} else {
  await doTruncate();
}
```

Rails has no fallback arm at any of the three sites:

```ruby
def truncate_tables(*table_names)
  table_names -= [pool.schema_migration.table_name, pool.internal_metadata.table_name]
  return if table_names.empty?
  disable_referential_integrity do
    statements = build_truncate_statements(table_names)
    execute_batch(statements, "Truncate Tables")
  end
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:222-231`;
`insert_fixtures_set` is the same shape at `:486-496`.)

`disable_referential_integrity` is defined on `AbstractAdapter` for every
adapter (`abstract_adapter.rb`, overridden in
`postgresql/referential_integrity.rb:7`, `sqlite3_adapter.rb:255`,
`abstract_mysql_adapter.rb:212`), and `execute_batch` likewise
(`database_statements.rb`), so the optionality is a property of trails'
`DatabaseStatementsHost` interface, not of Rails.

The same `?:` optionality appears on `DatabaseStatementsHost` itself
(`disableReferentialIntegrity?`, `executeBatch?`, `execute?`), which is what
forces the branches at the call sites.

Surfaced while dropping the `scopedTables` parameter from
`disableReferentialIntegrity` (story
`converge-referential-integrity-scoped-tables-parameter`, PR #7105), which
removed the invented `executed` fallback dance from both call sites but left
the host-optionality arms in place.

## Converged shape

Make `disableReferentialIntegrity`, `executeBatch` and `execute` required on
`DatabaseStatementsHost` and call them unconditionally, so both bodies read
like database_statements.rb:222-231 / :486-496. Test doubles that currently
lean on the optionality supply the members instead.

Check `wire-mysql-execute-batch-onto-adapter` first — if `executeBatch` is not
yet on every adapter, that story is a dependency for the `executeBatch` third
of this one.

## Acceptance criteria

- [ ] `truncateTables` calls `disableReferentialIntegrity` and `executeBatch`
      unconditionally, with no `??`/`if` fallback arm.
- [ ] `insertFixturesSet` likewise, and calls `transaction` unconditionally.
- [ ] The three members lose their `?` on `DatabaseStatementsHost`.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
