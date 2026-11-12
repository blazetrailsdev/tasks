---
title: "Zeitwerk's Mutex#synchronize callers stay synchronous and raise on contention"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: [zeitwerk]
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 4. `zeitwerk/lib/cref/map.ts:59,68,76`,
`zeitwerk/lib/loader.ts:646` and `zeitwerk/lib/loader/config.ts:71,87,95,104,121`
drop `Mutex#synchronize`'s result. Their Rails-side methods (`Loader#setup`,
the `Config` setters, `Cref::Map`) are synchronous public API in Zeitwerk, so
making callers async does not terminate. `ruby-compat/lib/mutex.ts:139-183`
runs a sync block inline when uncontended and returns a promise only when
contended.

## Acceptance criteria

- [ ] Each site goes through the sync-entry rule of RFC § Design 4: the block runs inline, and if `synchronize` hands back a promise (contention), the caller raises `ThreadError` rather than continuing; no promise is dropped.
- [ ] A test holds the lock and proves the second synchronous caller raises instead of proceeding before its block runs.
- [ ] zeitwerk's `floating` mark drops by 9.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story. Making `Loader#setup` or the `Config` setters async does not close it either.
