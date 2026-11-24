---
title: "Trailties Tests shard 1 has ~25% headroom under its 20m timeout"
status: ready
updated: 2026-11-24
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Trailties Tests` (`.github/workflows/ci.yml:1255-1266`) runs `pnpm vitest run packages/trailties packages/thor --shard=N/2` with `timeout-minutes: 20`. A passing shard 1 on main (2026-11-20) took 14.5 min, 808.95s of it inside vitest. The last seven main jobs ranged from 6.4 to 17.6 min.

trails#10414's run 44793303105 cancelled shard 1 at 20 min. Nothing hung: files kept finishing until the cancel. `application/initializers/frameworks.test.ts` took 580s there against 378s on main, which points to a slow runner.

The shard's wall time is set by a few files that boot a full application. On the passing main run they were:

- `application/mailer-previews.test.ts`: 644s
- `application/routing.test.ts`: 399s
- `application/initializers/frameworks.test.ts`: 378s
- `application/test-runner.test.ts`: 223s

## Acceptance criteria

- [ ] Trailties shard 1 completes with at least 40% headroom under its timeout on a typical runner. Either move to 3 shards, with the heavy application files kept in separate shards, or cut those files' boot cost.
- [ ] Raising `timeout-minutes` alone does not satisfy this story.
