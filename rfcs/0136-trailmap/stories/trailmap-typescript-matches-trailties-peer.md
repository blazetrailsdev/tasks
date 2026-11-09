---
title: "trailmap's typescript devDependency matches trailties' 7.1 nightly peer"
status: done
updated: 2026-11-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trailmap#135
claim: "2026-11-09T20:55:16Z"
assignee: "e2e-cover-the-pane-message-box"
blocked-by: null
closed-reason: null
---

## Context

`@blazetrails/trailties` peers `typescript: "7.1.0-dev.20260920.1"` (its `package.json` `peerDependencies`; pinned by trails#8032). trailmap's `package.json:55` has `"typescript": "^5.8.0"`, and its lock resolves `typescript@5.9.3`. Every `@blazetrails/trailties` snapshot in `pnpm-lock.yaml` carries `(typescript@5.9.3)`, so `pnpm install` warns `unmet peer typescript@7.1.0-dev.20260920.1: found 5.9.3`. This predates trailmap#128 and is the one warning that install still prints.

## Acceptance criteria

- trailmap's `typescript` devDependency matches trailties' peer, the exact 7.1 nightly. `pnpm install` prints no unmet-peer warning.
- `pnpm build --noEmit` (CI's typecheck), `trails-tsc-views build` and `pnpm test` pass on it. Any app code that needs a change for 7.1 is changed in the same PR.
