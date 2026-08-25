---
title: "Port while_preventing_writes to the PG/MySQL adapters so adapter-prevent-writes rides the ambient connection"
status: done
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 5544
claim: "2026-07-28T23:15:44Z"
assignee: "while-preventing-writes-non-sqlite-adapters"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `long-tail-memory-sites-ambient` (PR #5495, RFC 0029).

That story asked every listed `":memory:"` site to derive from the ambient
file-backed connection. `adapter-prevent-writes.test.ts` could not: Rails'
`adapter_prevent_writes_test.rb:13` is
`@connection = ActiveRecord::Base.lease_connection`, but trails implements write
prevention on **exactly one adapter**:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:629` —
  `async withPreventedWrites<R>(fn)`, the only definition in the tree
  (`grep -rn "withPreventedWrites" --include=*.ts` outside tests returns this
  one hit). There is no counterpart on `AbstractAdapter`, `PostgreSQLAdapter`
  or `Mysql2Adapter`.

Rails puts this on the pool/`Base`, not the adapter:
`ActiveRecord::Base.while_preventing_writes` →
`connected_to(prevent_writes: true)`, with `preventing_writes?` reading the
pool (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`,
`connection_handling.rb`). Every lane therefore runs the suite in Rails.

Consequence: `adapter-prevent-writes.test.ts` stays sqlite-pinned on **every**
lane — on the PG and MySQL lanes it silently constructs a
`BetterSQLite3Adapter` rather than exercising the lane under test, so the
`ReadOnlyError` gating on PG/MySQL has no coverage at all. PR #5495 only moved
its database off `":memory:"` onto a scratch file
(`support/scratch-database.ts`); the divergence itself is untouched and was
called out in the PR body as out of scope.

Note the related draft `converge-adapter-prevent-writes-canonical-subscribers`
(0023): it wants the same file on the canonical `subscribers` shape. That
convergence is much easier _after_ this one, since riding the ambient
connection gets the canonical table for free instead of via
`rebuildCanonicalTables` on a scratch database. Sequence them.

## Acceptance criteria

- [ ] Write prevention is reachable on the PG and MySQL adapters, spelled as
      Rails spells it (`while_preventing_writes` / `preventing_writes?` at the
      `Base`/pool level, per `connection_handling.rb`) rather than as a
      sqlite3-only adapter method.
- [ ] `adapter-prevent-writes.test.ts` leases the ambient connection
      (`Base.leaseConnection()`), matching `adapter_prevent_writes_test.rb:13`,
      and runs on all three lanes.
- [ ] SQL literals in that file lose their sqlite-only identifier quoting —
      `adapter.test.ts:374` already spells the same probes lane-agnostically
      (`INSERT INTO subscribers(nick) VALUES('me')`).
- [ ] The PG-gated `doesnt error when a select query has encoding errors`
      variant keeps its existing `adapterType` gate; the two Rails variants
      stay distinct.
- [ ] No test renamed. `parity:test` delta >= 0.
