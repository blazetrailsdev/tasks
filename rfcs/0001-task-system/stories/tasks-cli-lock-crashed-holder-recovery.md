---
title: "Recover a tasks-CLI lock wedged by a crashed holder (safe stale-lock cleanup)"
status: draft
updated: 2026-06-12
rfc: "0001-task-system"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3140 (claims-concurrency-lock) added a `wx`-based advisory file lock around
`commitAndPush` in `scripts/tasks/cli.ts`. To guarantee it never silently drops
an edit, the lock is **deliberately not self-healing**: a waiter never removes a
lock it didn't create (auto-reclaim would vacate the path, letting a third
waiter `wx`-acquire in the gap → two holders → silent drop, and no POSIX
primitive removes a path conditional on its identity).

Consequence: if a `pnpm tasks` process is SIGKILLed/OOM-killed while holding the
lock, the lock file persists and **every subsequent mutation from every agent
fails loudly** (`LOCK_TIMEOUT_EXIT = 75`, message names the dead pid and the
file) until someone `rm`s it. `acquireTasksLock` already detects this via
PID-liveness (`process.kill(pid, 0)` → ESRCH); it just refuses to act on it.

This is the accepted trade-off, but the wedge needs a recovery path so an
autonomous fleet doesn't stall on a crashed holder.

## Acceptance criteria

- [ ] A crashed-holder lock is recovered without manual intervention, **without
      reintroducing the reclaim race** — e.g. a single coordinator (the spawn
      loop / orchestrator) GCs a dead-pid lock, or a `pnpm tasks unlock` command
      that removes the lock only when its owner pid is confirmed dead.
- [ ] Recovery is safe under concurrency: it must never remove a live holder's
      lock, and two recoverers must not both succeed into a vacancy.
- [ ] Regression coverage for the crashed-holder recovery path.

## Notes

Candidate approaches: orchestrator-side cleanup keyed off the dead-pid error
(exit 75); a dedicated `unlock` subcommand gated on the dead-pid check; or a
lock-as-directory + side-channel liveness. Whichever is chosen, keep the
acquire/release paths' "never remove a lock you didn't create" invariant intact
and isolate the (necessarily privileged) removal to one place.
