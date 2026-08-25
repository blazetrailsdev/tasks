---
title: "sqlite disconnectBang returns with the handle still open when the statement lock is held"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6341
claim: "2026-08-10T15:09:04Z"
assignee: "check-limit-measures-utf16-units-not-bytes"
blocked-by: null
closed-reason: null
---

## Context

PR #6337 (`sqlite-disconnect-must-serialize-on-statement-lock`) made
`SQLite3Adapter#disconnectBang` serialize against in-flight statements: when
`_statementLock` is held, the whole close body (`_disconnect`, which calls
`super.disconnectBang()` and closes the driver handle) is chained onto the
lock's tail instead of running inline.

That is the closest TS gets to Rails, where `disconnect!` and
`with_raw_connection` take the same `@lock`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:696-701`,
`:983-984`) — but it is not identical. Ruby's `@lock.synchronize` BLOCKS, so by
the time `disconnect!` returns the handle is closed. JS cannot block, so
`disconnectBang` returns with the handle still open and `active()` still
answering `true` until the deferred body runs. `close()` / `whenClosed()` drain
it, so pool teardown is correct, but a caller that reads `active()` immediately
after `disconnect!` sees a state Rails never exposes.

Files:
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
(`disconnectBang`, `_disconnect`, `_chainClose`).

## Converged shape

Most likely subsumed by
[[retire-sqlite-statement-lock-onto-with-raw-connection]]: once `perform_query`
runs under a real `with_raw_connection` that owns the adapter-level lock, the
disconnect path should take that same lock rather than a sqlite-private FIFO,
and the two trails-only helpers (`_disconnect` / `_chainClose`) go away with it.
Land that first and check whether anything is left here; if the deferred-return
window survives, close it by making the adapter's disconnect surface async
(`disconnectBang` already has a sync `void` contract to preserve, so the answer
is probably that every caller awaits `whenClosed()`).

## Acceptance criteria

- [ ] After the fix, no in-flight statement can observe a closed handle AND no
      caller can observe an open handle after the disconnect surface it awaited
      has returned.
- [ ] `_disconnect` / `_chainClose` are gone, or their remaining need is
      justified at the call site with a Rails cite.
- [ ] sqlite3 lane green, including
      `sqlite3-adapter-perform-query.trails.test.ts >
"does not close the handle out from under a statement holding the lock"`.
