---
title: "primaryKeyOrderCache / resolvePrimaryKeyColumns have no Rails counterpart now that table holds the raw primary_key"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumper#table` (packages/activerecord/src/schema-dumper.ts:446-478) now
reads `primary_key` and branches on its raw return the way Rails does
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:166,170-185`,
converged by #7571). What it still carries around that Rails does not is the
apparatus that used to serve that branch:

- `primaryKeyOrderCache` (`schema-dumper.ts:198`), a per-table
  `Record<string, string[] | undefined>` written at `:450`;
- `resolvePrimaryKeyColumns` (`:588`) and `orderPrimaryKeyColumns` (`:597`);
- their two overrides, `postgresql/schema-dumper.ts:10-18` and
  `mysql/schema-dumper.ts:16-26`, which re-derive the same ordering from the
  same cache.

Rails needs none of it. The `when String` arm is a one-liner —
`pkcol = columns.detect { |c| c.name == pk }` (`schema_dumper.rb:173`) — and the
`when Array` arm never looks at columns at all, it prints `pk.inspect`
(`:182`). Ordering is not a problem Rails has, because `primary_key` already
answers in the right order; the cache exists only because the retired
`ColumnInfo` projection had flattened pk membership into a per-column boolean
and the order had to be recovered afterwards.

Now that `table` holds the raw `pk`, the only surviving reader is the String
arm's `pkColumns[0]`, which is `columns.detect` spelled through four methods and
a cache.

## Converged shape

- `table`'s String arm reads `columns.find((c) => c.name === pk)` inline, as
  `schema_dumper.rb:173` does.
- `primaryKeyOrderCache`, `resolvePrimaryKeyColumns` and
  `orderPrimaryKeyColumns` are deleted, along with the postgresql and mysql
  overrides — there is nothing left for them to order.
- The dumper suites stay green on all three lanes, including the composite-key
  cases (`schema-dumper.trails.test.ts` "emitTable emits primaryKey array for
  composite primary keys", `primary-keys.test.ts`).

## Acceptance criteria

- [ ] The three members above are gone from `schema-dumper.ts` and both
      adapter overrides are gone.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow, and the
      extra-surface gate's `activerecord` totals go DOWN.
- [ ] Green on sqlite3, postgresql and mysql.
