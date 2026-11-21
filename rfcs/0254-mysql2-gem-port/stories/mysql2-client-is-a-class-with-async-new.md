---
title: "Mysql2::Client is a class: protected constructor plus static async new, no run-time decorator"
status: in-progress
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: client
packages: ["mysql2", "activerecord"]
deps: ["mysql2-client-result-statement-move-to-the-package"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#10491
claim: "2026-11-21T13:04:24Z"
assignee: "mysql2-client-result-statement-move-to-the-package"
blocked-by: null
closed-reason: null
---

## Context

trails has no `Mysql2::Client` class. `Mysql2.Client` is an object literal with a `new` arrow
(`packages/activerecord/lib/mysql2/client.ts:675-690`, moved by the previous story) that calls
`initialize` on an empty `Wrapper` object (`:552-647`), which calls `connect` (`:517-549`), which
builds a `mysql2/promise` `Connection` and hands it to `mysql2Client()` (`:449-499`). That decorator
`Object.defineProperty`s `queryOptions`, `affectedRows`, `_query`, `query`, `prepare`,
`abandonResultsBang`, `setServerOption`, `warningCount` and `automaticClose` onto the npm object,
wraps `execute`, patches `connection.handlePacket` and replaces `config.typeCast`, keeping state in
five module-level `WeakMap`/`WeakSet`s (`TYPE_CAST`, `INVALID_DATE`, `QUERY_OPTIONS`,
`WARNING_COUNT`, `AUTOMATIC_CLOSE`, `:391-430`).

Rails: `class Client; attr_reader :query_options, :read_timeout` (`vendor/mysql2/0.5.6/lib/mysql2/client.rb:2-3`),
`def initialize(opts = {})` ending in `connect(user, pass, host, port, database, socket, flags, conn_attrs)`
(`client.rb:21-97`); `connect` and `_query` are C private methods (`ext/mysql2/client.c:1604-1605`).
`initialize` does I/O, so CLAUDE.md § "Every promise has an owner; async `initialize` is an awaited
`static new`" (RFC 0234) applies: a `protected constructor` with the synchronous part and
`static async new` that awaits `connect`.

Receipts this removes: `initialize` (`client.ts:551`) and `connect` (`:516`) are mis-receipted
`@noRailsEquivalent PERMANENT` (both are gem names); `options` (`:99`), `storeResult` (`:113`) and
`INVALID_DATE` (`:393`) become private members of the class, unscored C-half, unreceipted. `driverError` and the two `error.ts` receipts are left to `mysql2-adapter-calls-the-gem-not-the-npm-connection`, which rewrites the error boundary.

This converges the mysql2 bullet of RFC 0156's
`declaration-only-mysql2-client-readers-and-struct-attributes-writer` (`Client#query_options` /
`#read_timeout` declaration-only rows). That story is not duplicated here; it keeps its solid-queue
row and drops the mysql2 bullet once this lands.

Six activerecord tests call `mysql2Client()` on a hand-built connection
(`adopted-raw-connection.trails.test.ts`, `mysql2-adapter.configure-on-connect.trails.test.ts`,
`.internal-execute-cast-result`, `.connected-vs-active`, `.base-connection-field`,
`.verify-unconfigured-connection`).

## Acceptance criteria

- [ ] `export class Client` in `packages/mysql2/lib/client.ts` with `protected constructor(opts = {})` holding `client.rb:21-94`'s synchronous body in Rails order, and `static async new(opts = {})` built with `rbClassNewInstance` that awaits `connect(...)`. `Mysql2.Client` is that class. No `ready` field, no factory under another name.
- [ ] `queryOptions` and `readTimeout` are readers on the class; `pnpm parity:api --package mysql2 --missing` shows no `[declaration-only]` row for `client.rb`.
- [ ] `mysql2Client()`, `Wrapper`, the `Mysql2Client` interface and all five module `WeakMap`/`WeakSet`s are deleted; their state is instance fields. The npm `Connection` is a private field the class created; `handlePacket` / `typeCast` hooks are installed on that connection inside `connect`, never on a caller's object.
- [ ] `defaultQueryOptions`, `parseFlagsArray`, `parseConnectAttrs`, `query`, `localOffset` are class members at their gem names (static where the gem's are); C-defined methods (`close`, `isClosed`, `ping`, `serverInfo`, `lastId`, `affectedRows`, `prepare`, `setServerOption`, `abandonResultsBang`, `automaticClose` writer, `warningCount`, private `connect` / `_query`) are members with no receipt.
- [ ] The `initialize`, `connect`, `options`, `storeResult` and `INVALID_DATE` receipts are gone; `pnpm parity:api:extra --package mysql2` output is in the PR body.
- [ ] The six tests that called `mysql2Client()` construct through `await Mysql2.Client.new(...)` or the adapter; none builds a bare npm connection. No test name changes.
- [ ] `pnpm parity:promises` marks do not rise.

## Verification

```bash
pnpm vitest run packages/mysql2 packages/activerecord/test/cases/connection-adapters/mysql2-adapter.*.trails.test.ts && pnpm parity:api --package mysql2 --missing && pnpm parity:promises
```
