---
title: "Zeitwerk Cref::Map value-returning synchronize sites raise ThreadError on contention"
status: ready
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/zeitwerk/lib/cref/map.ts` `set` / `get` / `getOrSetBang` / `delete` / `isEmpty` return `this._mutex.synchronize(...) as V` (or `as boolean`). `Mutex#synchronize` (`packages/ruby-compat/lib/mutex.ts`) returns a promise when the mutex is held, so under contention these casts hand a promise to a caller typed for a value. The block also still runs later. Zeitwerk's `Cref::Map` (`vendor/zeitwerk/.../lib/zeitwerk/cref/map.rb`) is synchronous public API. trails#10098 applied RFC 0234 § 4's sync-entry rule to the three statement sites (`deleteByValue`, `eachKey`, `clear`): a `raised` flag, then `ThreadError` when `synchronize` answers a promise. These value-returning sites were left as they are.

## Acceptance criteria

- [ ] Each value-returning `Cref::Map` site follows the same sync-entry rule: it throws `ThreadError` on contention, its queued block does nothing, and the `as V` / `as boolean` casts are gone.
- [ ] Extend `packages/zeitwerk/test/mutex.trails.test.ts` to cover `set`, `get`, `delete` and `isEmpty` while the mutex is held.
