---
title: "Stop recording a local-bound closure's calls at its definition site in order rows"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6436
claim: "2026-08-12T19:56:51Z"
assignee: "converge-pg-supports-optimizer-hints-memo"
blocked-by: null
closed-reason: null
---

## Context

`ConnectionPool#unpinConnection` now takes `connection.lock.synchronize(block)`
exactly where Rails writes `@pinned_connection.lock.synchronize`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:344-362`),
landed in PR #6431. It still carries an ORDER baseline row,
`order:checkin,lock`
(`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/connection-pool.json`).

The cause is an extractor artifact, not a body divergence: the critical section
is a hoisted arrow (`const block = async () => { … checkin … }`) because the
non-transaction-aware branch runs the same body WITHOUT a lock, so
`extract-ts-api.ts#collectCalls` records the arrow's calls at its DEFINITION —
ahead of the `lock` read that follows. A function-expression passed as a call
ARGUMENT is already deferred there (Ruby block semantics); a function assigned
to a local is not.

Same family as `extractor-predicate-and-closure-order-artifacts` and
`extractor-multi-candidate-call-credits-later-read`.

## Converged shape

`collectCalls` defers a function-expression bound to a local the same way it
defers one passed as an argument — recording its calls where the local is
INVOKED, not where it is defined — or the sequence treats such a local as
ambiguous and skips it. The `unpin_connection!` order row is then deleted by
hand, along with any sibling rows the fix makes stale.

## Acceptance criteria

- [ ] A closure bound to a local no longer records its calls at the definition
      site ahead of the enclosing body's own calls.
- [ ] The `unpin_connection! / order:checkin,lock` row is deleted; every other
      row the change makes stale is deleted with it.
- [ ] `pnpm parity:api:calls` green; the extractor's own unit tests cover the
      hoisted-closure case.
