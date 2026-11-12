---
title: "Mutex#synchronize with a sync block is typed and awaited consistently"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: []
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 4. `ruby-compat/lib/mutex.ts:138-140` types the sync-block
overload `T | Promise<T>`, so 15 callers look floating:
`actioncable/lib/subscription-adapter/redis.ts:162,187,217,227,285`,
`zeitwerk/lib/cref/map.ts:59,68,76`, `zeitwerk/lib/loader.ts:646`,
`zeitwerk/lib/loader/config.ts:71,87,95,104,121`.

## Acceptance criteria

- [ ] Decide from `mutex.ts` whether a sync block can ever yield a promise (contention). If not, the overload returns `T`; if so, every caller awaits.
- [ ] The 15 sites are clean under `no-floating-promises`.
