---
title: "Association and preload fan-outs follow Rails' sequential map"
status: ready
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0147 Design §2, associations / preloading group. These bodies run
association loads under `Promise.all` where the Rails body is a sequential
`.map` on one thread. Once the fan-outs run sequentially, same-context concurrency no longer comes from trails itself, and that is what makes `with-connection-drops-lease-fork-and-sibling-checkin` safe.

Sites (trails main `5ee8f3512`, `packages/activerecord/src/`):

- `associations/collection-association.ts:452`
- `associations/preloader/through-association.ts:209,216`
- `relation/query-methods.ts:305` (`extract_associated`)

## Acceptance criteria

- [ ] Each of the 4 sites is checked against its Rails body, and the PR lists
      each one with its Rails `file:line`.
- [ ] Where Rails is sequential, the TS body is sequential.
- [ ] Where Rails is genuinely concurrent (on separate threads), each member
      runs in its own `withExecutionContext`.
