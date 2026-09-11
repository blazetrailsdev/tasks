---
title: "Re-measure the six 0146 leasing stories parked in 0123 after RFC 0147 Phase 3"
status: ready
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["activerecord"]
deps: ["with-connection-drops-lease-fork-and-sibling-checkin"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0147 Design §4. RFC 0146 closed with six convergence stories parked in
`0123-blocked-convergence-holding`, all blocked on flows sharing one lease:

- `abstract-adapter-lock-defaults-to-monitor-not-nulllock`
- `server-version-barrier-takes-the-connection-lock-first`
- `converge-sync-connection-lease-per-checkout-verify`
- `connection-leasing-queue-internal-poll-carries-a-promise-arm`
- `converge-sql-for-insert-and-supports-insert-returning-to-sync`
- `sqlite-get-database-version-uses-query-value`

0146's Phase 1 patch defaults the adapter `lock` field to `NullLock`
(`abstract_adapter.rb:157`). On trails main `15627671d` it took two test files
from 30/30 to 4 failed / 26 passed on both `ARCONN=postgresql` and
`ARCONN=sqlite3_mem`. The four failing cases, all in trails-only
`.trails.test.ts` files, drive concurrent callers into one adapter from one flow:

- `postgresql-adapter.exec-query.trails.test.ts`: "reads currval on the session
  that ran its own INSERT"
- `abstract-adapter.lifecycle.trails.test.ts`:
  - "withRawConnection serializes concurrent calls and yields the connection"
  - "reconnectBang serializes concurrent callers"
  - "verifyBang serializes concurrent callers and promotes the unconfigured
    connection once"

The last two 0123 stories are gated by 0146 Design §2 (awaiting
`configureConnection` on the connect path), which is a Non-goal of 0147. They
are expected to stay parked.

## Acceptance criteria

- [ ] Each of the four failing tests either moves its concurrent callers into
      separate `withExecutionContext`s (the Thread.new analogue a Rails-shaped
      test would use) or is deleted as asserting behaviour Rails does not have.
      The PR says which, per test.
- [ ] With that, re-apply the `NullLock` patch and record the pass/fail count
      on both lanes in this story's PR.
- [ ] Each of the six 0123 stories that is now unblocked is moved onto 0147
      with `tasks rehome`. Each one still blocked gets its `blocked-by` updated
      to name the specific remaining gap.
