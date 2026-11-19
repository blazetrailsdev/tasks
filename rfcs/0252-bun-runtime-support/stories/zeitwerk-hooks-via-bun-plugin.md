---
title: "Generation-keyed module loader on ProcessAdapter (Bun.plugin namespace on Bun) so zeitwerk reloads"
status: draft
updated: 2026-11-19
rfc: "0252-bun-runtime-support"
cluster: runtime
packages: [ruby-compat, zeitwerk]
deps: [runtime-detection-and-bun-process-adapter]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

zeitwerk's only hook is the `resolve` hook in `zeitwerk/lib/core-ext/kernel.ts:34-55`, which appends `?zeitwerk=<generation>` to the URL. Bun 1.3.6 ignores query strings when it caches modules, and `onResolve` paths that carry a query fail with ENOENT. The RFC's § Module hooks has the spike table and the design.

## Acceptance criteria

- [ ] `ProcessAdapter.registerGenerationalLoader(match, generationOf)` exists. The Node adapter implements it with today's `registerHooks` resolve hook, unchanged.
- [ ] The Bun adapter implements it with a `Bun.plugin` `onResolve` into a namespace keyed by generation, plus an `onLoad` that reads the real `.ts`/`.js` file. Relative imports inside a loaded file resolve from that file's real directory.
- [ ] `kernel.ts` calls the new member; zeitwerk's existing tests pass unchanged on Node.
- [ ] Under Bun, a generated app boots, autoloads `app/models`, and an edited model reloads in development.
- [ ] If the namespace loader cannot work on a real app, this story goes to `blocked` for an operator ruling (RFC Open question 3).
