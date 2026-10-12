---
title: "The PostgreSQL schema dumper emits t.jsonb, which the Schema.define block's generic TableDefinition rejects"
status: done
updated: 2026-10-12
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: trails#8812
claim: "2026-10-12T13:55:14Z"
assignee: "pg-schema-dumper-emits-jsonb-the-define-block-cannot-type"
blocked-by: null
closed-reason: null
---

Surfaced by trailmap#59 (`/graphs/parity` on a Postgres projection).

**The PostgreSQL schema dumper writes a schema file that does not typecheck.**
Any application with a `jsonb` column gets a committed `db/*_schema.ts` that
fails `tsc`, so the dump cannot be checked in and CI cannot stay green.

A migration adds a jsonb column, `trails db migrate` dumps the schema, and the
dump contains:

```ts
await Schema.get(8).define({ version: 2026_10_11_000006 }, async (ctx) => {
  await ctx.createTable("parity_days", (t) => {
    …
    t.jsonb("gaps");
```

which fails:

```text
db/hub_schema.ts(38,7): error TS2551: Property 'jsonb' does not exist on
  type 'TableDefinition'. Did you mean 'json'?
```

`jsonb` is a PostgreSQL column helper and lives on the PostgreSQL
`TableDefinition`, but the block `Schema.define` hands its callback is typed
with the GENERIC `TableDefinition` — so the dumper emits a call the type of its
own output does not allow. The file RUNS correctly; only the typecheck fails,
which is what makes it easy to ship and awkward to live with.

`"jsonb"` IS in the `ColumnType` union
(`connection-adapters/abstract/schema-definitions.ts`), so the generic
`t.column("gaps", "jsonb")` typechecks and is what a hand-written migration can
use. The dumper does not have that option available to it today.

The same should be true of every other PostgreSQL-only helper the dumper can
emit — `hstore`, `inet`, `cidr`, `macaddr`, `uuid`, `daterange` and the rest —
so the fix wants to cover the family rather than `jsonb` alone.

## Expected shape

A schema dumped from a database typechecks against the adapter it was dumped
from. Either `Schema.define` types its block with the connected adapter's
`TableDefinition` (so a PostgreSQL dump gets the PostgreSQL helpers), or the
dumper emits the portable `t.column(name, "<type>")` for helpers the generic
definition does not declare. The first is the better shape — a PG dump is only
ever loaded by the PG adapter — but it is the larger change.

## Acceptance

- [ ] a test that dumps a schema containing `jsonb` and typechecks the result;
      it fails on the current code
- [ ] the same for at least one other PostgreSQL-only helper, so the fix is not
      special-cased to `jsonb`
- [ ] the dumped file still LOADS — whatever spelling is chosen round-trips
      through `db schema:load`
- [ ] trailmap's `db/hub_schema.ts` can carry its `gaps` jsonb column with
      `pnpm build` green
