---
title: "pg-exec-is-a-trails-only-raw-query-path"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

The SQLite half of `sqlite3-and-pg-exec-are-trails-only-raw-query-paths` shipped
in PR #TBD: `SQLite3Adapter#exec` is deleted and its ~90 callers moved to
`execute`, with the handful of multi-statement scripts split into per-statement
loops. The PostgreSQL half did not fit under the same LOC ceiling and is this
story.

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` (search
`async exec(`):

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

There is no `def exec` in
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`
or `postgresql/database_statements.rb`. `Base.connection.execute(sql)` is the
Rails spelling (`abstract/database_statements.rb`), and it already routes
through `performQuery` / `rawExecute`, so it picks up logging, query-cache
bookkeeping, `preprocessQuery`'s comment transformers and exception
translation — all of which the raw `exec` path skips.

Roughly 518 call sites across ~27 files under
`packages/activerecord/src/adapters/postgresql/**` (array, datatype, uuid,
range, enum, geometric, timestamp, schema, explain, …). The PG body is a plain
single-statement query, so unlike the SQLite one it renames cleanly — but the
sheer count needs more than one PR. Cut it by directory or by file group, each
PR from `main` with non-overlapping files.

## Acceptance criteria

- [ ] No `PostgreSQLAdapter#exec` — its callers use `execute`, or carry a
      `@noRailsEquivalent` receipt naming a need `execute` cannot serve.
- [ ] `pnpm parity:api:extra --package activerecord` novel count strictly drops,
      and `pnpm parity:api:extra:tighten` narrows the mark.
- [ ] PostgreSQL lanes green.
