---
title: "measure-allocation-gap-commit-and-method"
status: blocked
updated: 2026-11-18
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-18T14:36:34Z"
assignee: "measure-allocation-gap-commit-and-method"
blocked-by: "needs c7i.xlarge slim-harness rig time; operator chose not to launch a rig on 2026-11-18"
closed-reason: null
---

## Context

`measure-allocation-gap-between-entry-points` ruled the entry point out. On one
c7i.xlarge and on trails `2c79a8828b`, at 4,000 users, `trails server` allocated
237 KB per request and a direct `Node.run(Trails.application)` entry allocated
242 KB. Sampling covered the whole 2-minute k6 run, started and stopped by
signal, and the result was divided by k6's `http_reqs`. A 60 s window
(75–135 s after boot) gave 250 KB by a server-side request count. The entry
point accounts for about 2% of the gap between 108 KB (first profile,
`094dec8aa8`, direct entry, 3,000 users) and 267 KB (second profile).

Two causes are left. Either the code changed between `094dec8aa8` and now, or
the first profile divided by a different request count. On the rig,
`094dec8aa8`'s `trails server` printed the generator help and exited instead
of booting. That checkout also needs
`pnpm install --config.ignore-workspace-cycles=true` under pnpm 12.

## Acceptance criteria

- [ ] Boot `094dec8aa8`'s twelve-dollar-server on one rig and take the
      signal-bounded allocation pass at 4,000 users. Record its KB per request
      next to current main's.
- [ ] Record in the RFC README which cause, commit or method, holds which
      share of the gap.
