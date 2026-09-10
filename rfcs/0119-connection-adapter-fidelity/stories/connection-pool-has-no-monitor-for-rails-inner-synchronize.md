---
title: "ConnectionPool has no MonitorMixin, so Rails' four bare synchronize blocks are unported"
status: in-progress
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 30
pr: trails#7670
claim: "2026-09-10T18:29:19Z"
assignee: "retire-stale-read-uncommitted-suppression"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7657, which collapsed the pool's two pinning structures onto
Rails' single `@pinned_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:267-268,325-365`)
and ported `checkout`'s pinned branch from `connection_pool.rb:548-567`.

Rails' `ConnectionPool` is a monitor — `include MonitorMixin`
(`connection_pool.rb:217`) — and four of its methods take that monitor with a
bare `synchronize do`:

- `checkout` (`connection_pool.rb:551`), nested INSIDE
  `@pinned_connection.lock.synchronize`, which is what makes the
  "the pinned connection may have been cleaned up before we synchronized"
  re-check at `:553` atomic against a concurrent `unpin_connection!`.
- `connections` / the reaper paths at `:454`, `:485`, `:507`.

trails' `ConnectionPool`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`)
has no monitor at all. #7657 ported the OUTER
`@pinned_connection.lock.synchronize` and the `:553` re-check, so `checkout` is
no longer the barge it was — but the inner `synchronize do` is still absent, and
so are the three at `:454,485,507`. There is a `this._mutex` used at `:98-99`,
which is a different object serving a different call.

Note this is NOT `connection-pool-checkout-async-critical-section` (done, #7060)
or `synchronize-lock-barges-in-the-release-window` — both are about the
per-connection `lock`. This story is about the pool's own MonitorMixin.

## Converged shape

Establish whether `ConnectionPool` should carry a monitor of its own, mirroring
`include MonitorMixin` (`connection_pool.rb:217`), and if so port the four
`synchronize do` blocks at `:454,485,507,551` onto it — `:551` nested inside the
pinned connection's lock exactly as Rails nests it.

If the answer is that a single-threaded Node event loop makes the pool monitor
genuinely unnecessary, that is a ratifiable language shortcoming only if written
down as such (the way CLAUDE.md ratifies the zero-import slot) — a bare "JS is
single-threaded" is not enough on its own, because trails' execution contexts
already interleave across `await` boundaries, which is precisely the window
`:553`'s re-check exists to close.

## Acceptance criteria

- [ ] Either `ConnectionPool` takes a monitor and the four `synchronize do`
      blocks at `connection_pool.rb:454,485,507,551` are ported onto it, or the
      omission is ratified in CLAUDE.md with the specific constraint.
- [ ] `checkout`'s pinned branch keeps the `:553` re-check under whichever
      outcome lands.
- [ ] Connection-pool and transactional-fixture suites green on all three adapters.
