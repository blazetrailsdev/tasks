---
title: "End to end: a generated app built and run with production dependencies only, no tsx"
status: draft
updated: 2026-11-24
rfc: "0258-ship-compiled-javascript"
cluster: null
packages: ["trailties"]
deps: ["generated-app-ships-compiled"]
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

The acceptance bar for RFC 0258. Without a test that runs the compiled
output with the TypeScript toolchain removed, any new `.ts` literal on the
boot path regresses silently. Today's examples still pass because each one
ships source or a bundle that carries its own root marker.

## Acceptance

A CI job that:

1. runs `trails new` into a scratch directory (with a model, a view, a
   migration, a job), then `pnpm build` and `trails build`;
2. installs production dependencies only, and asserts that neither `tsx` nor
   `typescript` resolves;
3. runs, under `node --no-experimental-strip-types` from `dist/`,
   `db:prepare`, then `server` (`GET /up` is 200, and a page renders from
   its compiled view), then `jobs` (an enqueued job is performed);
4. stops the server cleanly.

It runs on every PR that touches trailties, actionpack, activerecord,
solid-queue or trails-tsc.
