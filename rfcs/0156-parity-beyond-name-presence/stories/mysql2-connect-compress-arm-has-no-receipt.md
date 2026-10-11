---
title: "activerecord: Mysql2 connect's COMPRESS arm has no receipt and no trails test"
status: draft
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8793.

`Mysql2::Client#initialize`
(`vendor/mysql2/0.5.6/lib/mysql2/client.rb:60-69`) folds `opts[:flags]` into
the connect flags and hands them to the C `connect`
(`client.rb:97`). libmysqlclient speaks the compressed protocol whenever the
`COMPRESS` bit is set.

The npm driver does not: it sends the `COMPRESS` capability flag but only
compresses when its own `compress` option is set, so a connection made with
the flag alone hangs on the first packet. trails#8793 added one line to
`connect` in `packages/activerecord/src/mysql2/client.ts`:

```ts
if ((flags & CLIENT_FLAGS.COMPRESS) !== 0) config.compress = true;
```

The line has no counterpart in the gem and carries no receipt. An
`@inventedArm if` tag on `connect` reds `pnpm parity:api:arms:throws`
(`declaration not compared`), because `connect` is not a compared pair; it
carries `@noRailsEquivalent CONVERGEABLE
mysql2-client-is-a-class-over-the-npm-connection`.

Only "passing arbitrary flags to adapter" and "passing flags by array to
adapter"
(`packages/activerecord/src/adapters/abstract-mysql-adapter/connection.test.ts`,
Rails `activerecord/test/cases/adapters/abstract_mysql_adapter/connection_test.rb:145-157`)
reach the arm, and only on the MariaDB lane.

## Converged shape

The arm stays, since the driver forces it. It is recorded where a gate reads
it: once `mysql2-client-is-a-class-over-the-npm-connection` makes `connect` a
compared member, the declaration carries `@inventedArm if — PERMANENT`.

## Acceptance criteria

- [ ] The `COMPRESS` arm in `connect` carries a receipt that
      `pnpm parity:api:arms:throws` accepts.
- [ ] A trails test in `packages/activerecord/src/mysql2/client.trails.test.ts`
      pins that a `COMPRESS` flag sets the driver's `compress` option.
