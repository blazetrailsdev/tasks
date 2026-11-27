---
title: "trailties vitest: combined globalSetups stall and exit 0 with no output"
status: draft
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In a fresh worktree, `npx vitest run <any trailties test>` prints `RUN v3.2.4` and exits 0 with no test output. Observed 2026-11-26 while working on trails#10823.

The trailties project's `globalSetup` in `vitest.config.ts` lists eight files: `packages/trailties/test/support/build-templates.ts`, `packages/trailties/test/support/isolation/global-setup.ts`, and the `build-templates.ts` of solid-cable, solid-queue, solid-cache, actionmailbox, actiontext and stimulus.

- Each one, run alone through tsx or as the only globalSetup, completes.
- All eight together stall. The main process's event loop drains while a setup is still awaited, and vitest's `onExit` exits 0.
- Removing any single entry does not fix it.
- Isolation children run plain `vitest run` (`activesupport/lib/testing/isolation.ts`), so they stall the same way and the parent reports `marshal data too short`.

The workaround was to build the templates with tsx, then strip every globalSetup entry from `vitest.config.ts` locally.

## Acceptance criteria

- [ ] Find which combination of globalSetup modules leaves a promise unsettled (likely a cyclic top-level await reached through vite-node) and fix it, so a trailties test runs locally with the committed config.
- [ ] A stalled globalSetup fails loudly instead of exiting 0 with no output.
