---
title: "SQLite3Adapter#exec and PostgreSQLAdapter#exec are trails-only raw-query paths"
status: claimed
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-09-06T12:58:18Z"
assignee: "respond-to-is-only-defined-on-attribute-methods-hosts"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while deleting the MySQL twin
(`mysql2-exec-is-a-trails-only-raw-query-path`, PR #7250), which established
that `#exec` is trails-only surface and that `execute` is the Rails spelling
for the job every caller was using it for.

Two siblings remain, and neither carries a `@noRailsEquivalent` receipt:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:697`

  ```ts
  async exec(sql: string): Promise<void> {
    await this.ensureConnected();
    await this.driver.exec(sql);
  }
  ```

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1461`

  ```ts
  async exec(sql: string): Promise<void> {
    await this.withRawConnection({}, async (conn) => {
      const client = conn as unknown as pg.Client;
      try {
        await client.query(sql);
      } catch (e) {
        throw this._translateException(e, sql, []);
      }
    });
  }
  ```

Neither has a Rails counterpart: there is no `def exec` in
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`,
`sqlite3/database_statements.rb`, `postgresql_adapter.rb`, or
`postgresql/database_statements.rb`. `Base.connection.execute(sql)` is what
Rails uses for this job
(`abstract/database_statements.rb`), and it already routes through
`performQuery` / `rawExecute`, so it picks up logging, the query cache
bookkeeping, `preprocessQuery`'s comment transformers and exception
translation — all of which the raw `exec` paths skip.

Every caller is a test laying or dropping a table. The PG one is the larger
share: `adapters/postgresql/**` uses `adapter.exec(...)` across roughly 25
files (array, datatype, uuid, range, enum, geometric, timestamp, schema,
explain, …). SQLite's callers are `core.trails.test.ts`,
`transactions.trails.test.ts`, `sqlite-adapter.trails.test.ts`,
`support/setup-adapter-suite.trails.test.ts`,
`test-fixtures/with-transactional-fixtures.trails.test.ts:83`,
`adapters/sqlite3/**` and `sqlite/**`.

Note the SQLite body is not a pure alias: `driver.exec` runs a multi-statement
script, which `execute` does not, so any caller passing several
semicolon-separated statements in one string needs splitting rather than a
mechanical rename. The PG body is a plain single-statement query and should
rename cleanly.

## Converged shape

- Callers move to `execute`, the Rails spelling, which already carries the
  logging and exception-translation the raw paths bypass.
- `exec` is deleted from both adapters.
- If a caller genuinely needs a multi-statement script path that `execute`
  cannot serve, that reason is the receipt — tag it `@noRailsEquivalent` in one
  of the two sanctioned shapes rather than leaving it untagged.

Split across as many PRs as the LOC ceiling needs; one adapter per PR is the
natural cut, and the PG half will likely need more than one on caller count
alone.

## Acceptance criteria

- [ ] No `SQLite3Adapter#exec` / `PostgreSQLAdapter#exec` — their callers use
      `execute`, or carry a receipt naming the multi-statement need.
- [ ] `pnpm parity:api:extra --package activerecord` novel count strictly drops.
- [ ] SQLite and PostgreSQL lanes green.
