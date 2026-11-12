---
title: "Callers of Mutex#synchronize await it"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: [actioncable, zeitwerk]
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

RFC § Design 4. `ruby-compat/lib/mutex.ts:139-183` runs a sync block inline
only when uncontended and otherwise returns a promise, so a caller that drops
the result continues before its critical section runs. Fifteen sites:
`actioncable/lib/subscription-adapter/redis.ts:162,187,217,227,285`,
`zeitwerk/lib/cref/map.ts:59,68,76`, `zeitwerk/lib/loader.ts:646`,
`zeitwerk/lib/loader/config.ts:71,87,95,104,121`; also `redis.ts:206`.

## Acceptance criteria

- [ ] Each call is awaited, and its method becomes async up to the first already-async caller.
- [ ] A test holds the lock from one caller and proves the second caller's block has run when its call resolves.
- [ ] actioncable's and zeitwerk's marks are tightened.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
