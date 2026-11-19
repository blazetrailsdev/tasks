---
title: "website-docs-typedoc-fails-under-ts5"
status: ready
updated: 2026-11-19
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

With `build:sw` and `vite build` fixed (alias `.js` suffix, `build.target: "es2022"` for libxml2's top-level await), `pnpm --filter @blazetrails/website docs:build` still fails in `docs:typedoc`. typedoc runs on the `typescript-5` (5.9) toolchain, while the workspace compiles with TS 7.1, and 5.9 reports type errors in ~50 files across `packages/activemodel/lib/` and `packages/activesupport/lib/` (e.g. `activesupport/lib/hash-with-indifferent-access.ts:638`, `Hash<string, unknown>` not assignable to `Hash<unknown, unknown>`). `typedoc.config.mjs`'s `packageOptions.entryPoints` was also still `src/index.ts` (now `lib/index.ts`).

The `website` job in `.github/workflows/ci.yml` stays disabled (`false &&` in its `if:`) until this passes.

## Acceptance criteria

- `pnpm --filter @blazetrails/website build` passes end to end, `docs:build` included (typedoc made to run on code TS 7.1 accepts: skipErrorChecking, or types that both compilers accept).
- Remove the `false &&` from the `website` job's `if:`.
