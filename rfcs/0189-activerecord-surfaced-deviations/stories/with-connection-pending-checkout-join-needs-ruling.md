---
title: "withConnection: ratify or converge the pending-checkout join arm"
status: blocked
updated: 2026-11-25
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-25T15:44:50Z"
assignee: "named-boot-loads-resolve-ts-then-js"
blocked-by: "operator decision: converge was chosen, but no connection_pool.rb:405-424-shaped body keeps 'withConnection overlapping on an empty lease checks out one connection' green - the join's holder count is what stops a sibling's release freeing a connection another in-flight call uses (one JS context shares the lease across await checkout). Needs a ruling on ratifying vs dropping that trails test."
closed-reason: null
---

## Context

trails#9043 made overlapping `ConnectionPool#withConnection` calls on an empty
lease join one pending `checkout` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`,
`withConnection`, module-level `pendingCheckouts`). Rails' `with_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:405-424`)
has no such arm: a Ruby lease belongs to one thread, so its read of
`lease.connection` and the write after `checkout` cannot interleave. In JS one
async context holds many in-flight calls across the `await`. The two invented
`if`s are receipted `@inventedArm if — CONVERGEABLE` against this story.

## Acceptance criteria

- The repo owner rules on the join arm. Either it is ratified in
  `packages/activerecord/CLAUDE.md` (next to "The adapter lock defaults to a
  monitor") and the receipt becomes `PERMANENT`, or a shape closer to
  `connection_pool.rb:405-424` replaces it, keeping the trails test
  "withConnection overlapping on an empty lease checks out one connection" green.
