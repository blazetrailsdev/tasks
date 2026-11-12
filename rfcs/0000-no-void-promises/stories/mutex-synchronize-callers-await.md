---
title: "Action Cable's Redis adapter awaits Mutex#synchronize"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: [actioncable]
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 150
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
the result continues before its critical section runs. Sites:
`actioncable/lib/subscription-adapter/redis.ts:162,187,206,217,227,285`. The
zeitwerk sites are `zeitwerk-mutex-callers-stay-synchronous`.

## Acceptance criteria

- [ ] Each call is awaited, and its method becomes async up to the first already-async caller. The listener methods are already async in the port, so the chain stops inside the adapter; if it reaches a Rails-synchronous public method, RFC § Design 4's sync-entry rule applies.
- [ ] A test holds the lock from one caller and proves the second caller's block has run when its call resolves.
- [ ] actioncable's `floating` mark drops by 6.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
