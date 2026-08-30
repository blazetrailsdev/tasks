---
title: "Mysql2Adapter#exec is trails-only surface that bypasses performQuery's default_timezone read"
status: done
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 7250
claim: "2026-08-30T15:23:49Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7219, and flagged in that PR's review.

`Mysql2Adapter#exec` (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`)
is a trails-only DDL escape hatch with no counterpart anywhere in
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb`
or `mysql2/database_statements.rb`:

```ts
async exec(sql: string): Promise<void> {
  this._databaseTimezone = ActiveRecord.defaultTimezone;
  const conn = await this.getConn();
  await conn.query(this.mysqlQuote(sql));
}
```

It carries no `@noRailsEquivalent` receipt. Every caller is a test using it to
lay or drop a table — `core.trails.test.ts:74,92,97`,
`migration.test.ts:2183-2187`, `pooled-test-adapter.trails.test.ts:25-43`.

Because it goes straight to `conn.query` and never through `performQuery`, it
is the one query path that does not pick up the `default_timezone` read that
PR #7219 centralised in `performQuery`
(`mysql2/database_statements.rb:47-49`). That PR restored the property with a
hand-rolled inline assignment — the same shape `configureConnection` uses per
`mysql2_adapter.rb:160` — which keeps behaviour correct but duplicates a line
that exists on this method only because the method itself is not Rails'.

`Base.connection.execute(sql)` is what Rails uses for exactly this job, and it
already routes through `performQuery`, so it gets the timezone read for free.

## Converged shape

- Callers move to `execute`, which is the Rails spelling
  (`abstract/database_statements.rb`) and already carries the timezone read.
- `exec` and its inline `_databaseTimezone` assignment are deleted.
- If some caller genuinely needs a raw path `execute` cannot serve, that
  reason is the receipt — tag it `@noRailsEquivalent` in one of the two
  sanctioned shapes rather than leaving it untagged.

## Acceptance criteria

- [ ] No `Mysql2Adapter#exec` — its callers use `execute`.
- [ ] The inline `_databaseTimezone` assignment goes away with it; the only
      sites reading `ActiveRecord.defaultTimezone` are `performQuery`
      (`mysql2/database_statements.rb:47-49`) and `configureConnection`
      (`mysql2_adapter.rb:160`).
- [ ] `pnpm parity:api:extra --package activerecord` novel count strictly drops.
- [ ] MySQL and MariaDB lanes green.
