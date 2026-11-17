---
title: "status-badge.test.ts fails after a local pnpm views: rendered partials carry BEGIN annotations"
status: draft
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After `pnpm views` with the local env, `npx vitest run test/views/status-badge.test.ts` fails all 5 cases. The rendered partial starts with `<!-- BEGIN app/views/shared/_status-badge...`, but the test expects `<span class="badge s-draft">draft</span>` exactly. CI passes the same test.

The likely cause is that the local views build turns on rendered-view filename annotations, and the test compares against the compiled output from that build. I have not verified this: check which env `pnpm views` builds under and whether the annotation flag differs. If the annotation is a trails default, or one that leaks across envs, this becomes a trails story instead.

Seen while working on trailmap#149, 2026-11-16.

## Acceptance criteria

- `pnpm views && pnpm test` passes locally on a clean checkout, the same as in CI.
- The test does not depend on the env the views were last built under: it strips annotations or builds its own.
