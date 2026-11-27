---
title: "trailties vitest project exits silently during globalSetup module load locally"
status: draft
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
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

Locally (this worktree, after `pnpm build`), `pnpm vitest run packages/trailties/test/application/version.test.ts` — any file in the `trailties` project — prints `RUN` and exits 0 with no results. `NODE_OPTIONS=--trace-exit` shows the event loop draining; `DEBUG=vite-node:*` shows the project's globalSetup modules (`packages/trailties/test/support/build-templates.ts`, `isolation/global-setup.ts`, and the solid-\*/actionmailbox/actiontext/stimulus `build-templates.ts`, listed in `vitest.config.ts:884-893`) being loaded concurrently and stalling after `packages/ruby-compat/lib/hash.ts` executes, before any setup body runs. Running each setup module directly under tsx completes. Dropping the six non-trailties setups did not help. Other projects (`--project zeitwerk`) run fine. CI's trailties shards pass, so it may be environment- or timing-dependent.

## Acceptance criteria

- [ ] Root cause identified (vite-node concurrent module evaluation deadlock, a cycle through `ruby-compat/lib/hash.ts`, or environment).
- [ ] A trailties isolation test runs locally with `pnpm vitest run <file>`.
