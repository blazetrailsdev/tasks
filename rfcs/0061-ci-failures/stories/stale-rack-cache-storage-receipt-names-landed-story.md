---
title: "stale-rack-cache-storage-receipt-names-landed-story"
status: closed
updated: 2026-11-23
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: trails#10592 already removed the stale port-rack-cache-memcache-stores receipt from packages/rack-cache/lib/storage.ts on main."
---

## Context

`scripts/stale-story-references.test.ts:211` reds Repo Checks on main
(seen on trails#10577, run 45059366821): `packages/rack-cache/lib/storage.ts:43`
carries `@missingRailsArgs resolve — CONVERGEABLE port-rack-cache-memcache-stores`,
and that story has landed. `Storage#create_store`'s `resolve` call arguments
still differ from Rails, so the receipt needs a live story, or the call
converges and the tag goes.

## Acceptance criteria

- [ ] `createStore`'s `resolve` call converges on Rails' arguments and the
      `@missingRailsArgs` tag is removed, or the tag names an open story that
      owns the convergence.
- [ ] `pnpm vitest run scripts/stale-story-references.test.ts` passes.
