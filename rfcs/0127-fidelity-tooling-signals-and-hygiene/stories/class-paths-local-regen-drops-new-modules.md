---
title: "Local parity:class-paths regeneration drops a package's newly merged modules"
status: draft
updated: 2026-11-17
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
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

# Local `pnpm parity:class-paths` drops a package's newly merged modules after a rebase

## Context

On trails#10256, after rebasing onto main at #10255 (solid-queue batch models), local `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api && pnpm parity:class-paths` regenerated `packages/solid-queue/lib/constants.generated.ts` without any of `batch.ts`, `batch-execution.ts`, `batch/*.ts` or `failed-execution/batchable.ts`. Those modules are exported from `packages/solid-queue/lib/index.ts`, and main's committed table includes them. `scripts/api-compare/class-paths.ts --check --record` then rewrote `scripts/api-compare/constant-residue.json`, moving `batch.ts::Batch` / `AlreadyFinished` / `PendingMigrations` and `batch-execution.ts::BatchExecution` into `excluded`, dropping activesupport's `core-ext/object/json.ts::Struct`, and setting solid-queue `rows` to 80. `--check` still reported `constants.generated.ts` stale against its own output, and CI's `class-paths.ts --check` disagreed with the local record. The PR landed by hand-editing main's residue file (+1 row).

Repro is not yet minimal. The suspicion is a stale input that `class-paths.ts` reads (the Ruby-side `rails-api.json` or a cached ts manifest) and that neither `API_COMPARE_FORCE=1` nor a fresh `pnpm build` refreshes.

## Acceptance criteria

- Find which input made the local walk miss the batch exports, and make `pnpm parity:class-paths` regenerate it, or fail loudly when it is stale.
- On a clean checkout of a commit whose CI `class-paths.ts --check` is green, local `--check` agrees.
