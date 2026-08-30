---
title: "Remove the invented _translateException helper; route adapters through translateExceptionClass"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7267, which converged `SQLite3Adapter#translateException` to
Rails' six arms and made its final arm delegate to
`AbstractAdapter#translateException`.

Every adapter reaches the translator through a trails-invented private helper
`_translateException(e, sql, binds)` that Rails does not have:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1755`
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1096`
  (plus the `mysql2-adapter.ts:137` override)
- called from `postgresql-adapter.ts:665`, `:672`, `:889`

Rails has exactly two methods on this path
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`):
`translate_exception_class(native_error, sql, binds)`, which builds the message
as `"#{native_error.class.name}: #{native_error.message}"`, restores the
backtrace and sets the cause, and `translate_exception(exception, message:,
sql:, binds:)`, which each adapter overrides. trails ports both
(`abstract-adapter.ts:1969`, `:2029`), so `_translateException` is a third,
parallel entry point that duplicates the cause/message bookkeeping — and
duplicates it _differently_: it passes the raw driver message as `message`,
where `translateExceptionClass` prefixes the error class name. A
`StatementInvalid` raised through a driver callback therefore carries a
different message depending on which entry point the adapter happened to use.

`abstract-mysql-adapter.ts:1162-1163` makes the inversion explicit — its
`translateException` override does nothing but call `_translateException`, i.e.
the ported Rails method delegates to the invention rather than the other way
around.

## Converged shape

`_translateException` is removed. Call sites call
`this.translateExceptionClass(e, sql, binds)`, which is the Rails entry point
(`abstract_adapter.rb`), and each adapter's `translateException` override is
reached only through it. The MySQL override stops delegating to the helper and
carries its own arms. Message construction and cause/backtrace restoration live
once, in `translateExceptionClass`.

## Acceptance criteria

1. `_translateException` no longer exists on any adapter; every call site goes
   through `translateExceptionClass` / `translateException`.
2. `StatementInvalid#message` is the Rails `"<ClassName>: <message>"` shape on
   every adapter path.
3. `pnpm parity:api:extra --package activerecord` shows the helper gone with no
   replacement novel surface; `pnpm parity:api:calls` / `:args` green.
4. SQLite, PostgreSQL and MySQL suites green.
