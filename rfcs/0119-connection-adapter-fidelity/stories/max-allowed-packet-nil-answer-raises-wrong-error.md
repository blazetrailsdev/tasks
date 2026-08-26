---
title: "max_allowed_packet's nil answer raises 'Fixtures set is too large' where Ruby raises ArgumentError"
status: draft
updated: 2026-08-26
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review on PR #7090, which converged `max_allowed_packet` onto
Rails' single line and deleted the invented 16 MiB fallback.

`packages/activerecord/src/connection-adapters/mysql/database-statements.ts#maxAllowedPacket`
is now:

```ts
return (this._maxAllowedPacket ??= Number(await this.showVariable("max_allowed_packet")));
```

mirroring `vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/database_statements.rb:89-90`
— `@max_allowed_packet ||= show_variable("max_allowed_packet")`.

The divergence is in what happens when `show_variable` cannot answer.
`AbstractMysqlAdapter#show_variable` returns `nil` on `StatementInvalid`
(`abstract_mysql_adapter.rb`, mirrored at
`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1010-1018`),
so in Ruby `max_allowed_packet` yields `nil` and the very next line —
`current_packet.bytesize > max_allowed_packet`
(`mysql/database_statements.rb:76-77`) — raises
`ArgumentError: comparison of Integer with nil failed`.

In trails `Number(null)` is `0`, so the same failure instead raises the
`ActiveRecordError` from the branch below it:
`"Fixtures set is too large #{current_packet.bytesize}. Consider increasing the
max_allowed_packet variable."` (`mysql/database_statements.rb:79-80`). It does
fail loudly, at a raise site Rails actually has — but with the wrong error class
and a message that misdescribes the cause (the packet is not too large; the
server never answered).

Unreachable on a live MySQL connection, which is why Rails carries no guard.
It becomes reachable through a stubbed or degraded `showVariable`.

## Converged shape

`maxAllowedPacket` returns a value that reproduces Ruby's `nil`-comparison
failure rather than collapsing to `0` — e.g. keep the nullable through the
memo and let `is_max_allowed_packet_reached?`'s comparison raise
`ArgumentError("comparison of Integer with nil failed")` at
`mysql/database_statements.rb:76`, which is the raise Ruby produces on the same
input. Do NOT reintroduce a fallback value, and do NOT add a guard Rails has no
counterpart for — the goal is the same error from the same line.

## Acceptance criteria

- [ ] A `showVariable` that answers `null` surfaces `ArgumentError` with Ruby's
      `comparison of Integer with nil failed` message, from the comparison in
      `isMaxAllowedPacketReached`, not the "Fixtures set is too large" branch.
- [ ] No fallback constant and no extra guard branch is added;
      `maxAllowedPacket` stays a one-line mirror of
      `mysql/database_statements.rb:89-90`.
- [ ] `mysql/database-statements.trails.test.ts`'s "raises rather than
      combining when the server does not answer" case asserts the new error.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
