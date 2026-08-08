---
title: "raw-test-and-second-connection-adapters-carry-a-real-pool"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6210
claim: "2026-08-08T00:09:22Z"
assignee: "raw-test-and-second-connection-adapters-carry-a-real-pool"
blocked-by: null
closed-reason: null
---

## Context

`test-helpers/test-adapter.ts:120,127,139` (`newRawTestAdapter`) and
`support/second-connection.ts:20` (`withSecondAdapter`) both construct adapters
outside any pool, so each carries the constructor's `NullPool` seed
(`abstract-adapter.ts:833` = `abstract_adapter.rb:153`) and reads `undefined`
from `role` / `shard` where Ruby's bare `@pool.role`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:286-296`)
raises `NoMethodError`.

`second-connection.ts:1-8` documents the deviation in its own header: Rails uses
`@connection.pool.checkout` to obtain a second connection from the _same_ pool;
trails opens an independent adapter with independent state. Converging it means
porting the `pool.checkout` shape at the call sites.
`newRawTestAdapter` is deliberately raw — each instance caps its driver at a
single server connection precisely because the outer pool multiplexes — so it
needs a pool that hands back that same single connection rather than a stock
`ConnectionPool`.

Blocks `abstract-adapter-role-shard-cast-hides-ruby-nomethoderror`.

## Acceptance criteria

- [ ] `withSecondAdapter`'s callers obtain the second connection through
      `pool.checkout`, matching Rails, or the helper's adapter carries a real
      pool.
- [ ] `newRawTestAdapter`'s adapters carry a real pool without losing the
      single-server-connection cap.
- [ ] No test renamed; PG lane green.
