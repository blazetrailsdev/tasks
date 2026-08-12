---
title: "port-async-critical-sections-for-pool-lifecycle"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6408
claim: "2026-08-12T11:06:01Z"
assignee: "port-async-critical-sections-for-pool-lifecycle"
blocked-by: null
closed-reason: null
---

## Context

Split out of `port-async-critical-sections-for-mutex-guarded-lifecycle`, which
shipped the adapter-lifecycle half in PR #TBD (the story's own escape clause:
"If the work exceeds the PR ceiling, ship the adapter-lifecycle half
(`reconnectBang` / `verifyBang` / `reloadTypeMap`) and file the pool half").

Converged in that PR, using `TransactionManager#synchronize`
(`connection-adapters/abstract/transaction.ts:1194`) as the trails-native
`Mutex#synchronize` analogue for an async body:

- `abstract-adapter.ts#reconnectBang` (`abstract_adapter.rb:662-676`)
- `abstract-adapter.ts#verifyBang` (`abstract_adapter.rb:757-775`)
- `postgresql-adapter.ts#reloadTypeMap` (`postgresql_adapter.rb:349-372`)
- `mysql2-adapter.ts#reconnect` (`mysql2_adapter.rb:149-155`)

Classified during that PR and NOT converged:

- `mysql2-adapter.ts#disconnectBang` — the ported body is fully synchronous
  (`mysql2-adapter.ts:1563`), so run-to-completion already gives it the
  mutex's guarantee. Tier 2 / reason-text route, not this story.
- `postgresql-adapter.ts#resetBang` — likewise synchronous
  (`postgresql-adapter.ts:2908`, `override resetBang(): void`). Tier 2.

Left to do — read the Rails body and the TS body for each, then converge the
ones whose awaits sit inside the protected state:

- `abstract/connection-pool.ts#unpinConnectionBang` (`connection_pool.rb`) —
  awaits inside the try while the pin state is half-torn-down.
- `pool-config.ts#disconnectBang` (`pool_config.rb`).
- `migration.ts#call` (`migration.rb:657`, `@mutex.synchronize`).

Do NOT touch the 22 rows the parent story excludes (18 sync bodies, four of
which converge instead by wiring up the dead pass-through at `queue.ts:358`,
plus ~4 async wrappers over a synchronous core).

## Acceptance criteria

- [ ] Each of the three candidates confirmed or excluded by reading the Rails
      body and the TS body, with the finding recorded per method.
- [ ] For each confirmed member, the critical section is restored via
      `TransactionManager#synchronize`, keeping the Rails method name and a
      block-shaped body — no second lock shape.
- [ ] A regression test per distinct hazard that asserts the interleaving (not
      just the end state) and fails on the baseline.
- [ ] Converged rows deleted by hand from `call-mismatches-exclude/` (never a
      `--write` reseed of the tree; `pnpm parity:api:calls:reseed` for the mark shards
      only), and `pnpm parity:api:calls` ends green with zero mark slack.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
