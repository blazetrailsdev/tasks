---
title: "Add the Tier 2 mutex reason category (synchronous core, post-hoc drains) and apply it"
status: done
updated: 2026-08-09
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6278
claim: "2026-08-09T13:15:56Z"
assignee: "port-remaining-mysql2-rake-tests"
blocked-by: null
closed-reason: null
---

## Context

PR #6275 shipped `--set-reason <category>` on
`scripts/api-compare/lint-call-mismatches.ts` and seeded exactly one category,
`mutex-sync-body`, scoped to the mutex audit's **Tier 1** (11 rows: fully
synchronous ported bodies, no yield point).

The audit's **Tier 2** is still unreviewed — every one of these rows carries the
seeded `DEFAULT_REASON`:

- `connection-pool.ts` `flush` (`:1145`), `discardBang` (`:1019`),
  `clearReloadableConnections` (`:1079`)
- `pool-config.ts` `discard_pool!`

Their Ruby counterparts guard the body with `Mutex#synchronize`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`
— `flush` / `discard!` / `clear_reloadable_connections!`, and
`pool_config.rb#discard_pool!`). Tier 1's reason text is **wrong for them**:
they are `await Promise.all(this._syncCore())`-shaped, so they DO have yield
points. The warrant that actually holds is different and narrower — the state
mutation is a synchronous core, and the awaits are driver-close drains that
follow it — which is falsifiable and names the invariant a later refactor must
not break.

Per the audit addendum, stamping Tier 1's text onto these rows would assert
something false about them; that is why the shipped category names its rows
outright instead of keying on the `synchronize` call name.

Tier 3 (awaits INSIDE the critical section — real unported concurrency
guarantees) is already owned by
`0084-wide-call-set-burndown/port-async-critical-sections-for-mutex-guarded-lifecycle`,
and the queue.ts rows converge instead (separate story). This story is Tier 2
only.

## Converged shape

A second `REASON_CATEGORIES` entry — `mutex-sync-core-async-drain` — naming the
four Tier 2 rows outright, whose `reason` states the synchronous-core /
post-hoc-drain warrant and whose `note` records the audit evidence, applied with
`pnpm tsx scripts/api-compare/lint-call-mismatches.ts --set-reason
mutex-sync-core-async-drain` (verify with `--dry-run` first).

Before writing the reason, re-read each of the four TS bodies and confirm the
shape still holds — the category must not be seeded from this story's prose.

## Acceptance criteria

- [ ] Each of the four Tier 2 bodies re-read against its Rails counterpart and
      confirmed to mutate synchronously before its first `await`.
- [ ] Category defined with its rows named outright and the evidence in `note`.
- [ ] `--dry-run` matches exactly those rows; the run rewrites them and reseeds
      the marks.
- [ ] `pnpm parity:api:calls` green with zero slack afterwards.
