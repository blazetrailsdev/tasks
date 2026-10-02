---
title: "Cut the full-tree ESLint heap footprint instead of raising the cap"
status: draft
updated: 2026-10-02
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

## Context

`pnpm lint` (`package.json:16`, `eslint .`) is run in full by the `Lint` CI job on every push to `main` and on any PR touching a `LINT_ALL_RE` file (`.github/workflows/ci.yml`, the `changes` job). Its memory footprint grows with the tree and has now outgrown its heap cap twice in effect: main went red at b03ec13f with a V8 heap OOM (exit 134), fixed in trails PR 8377 by raising `--max-old-space-size` from 6144 MB to 10240 MB. That is headroom, not a cure.

Measured on main at 7d299048 with `node --max-old-space-size=14000 --trace-gc node_modules/eslint/bin/eslint.js .`:

- 13 mark-compacts; largest live heap after one: 5993 MB; largest heap entering one: 6671 MB.
- Peak RSS 7.9 to 8.1 GB, wall time about 7:25 on a 24-core host.
- The GitHub-hosted runner has 16 GB, so the 10240 MB cap is the last comfortable step.

The likely driver is the typed-lint block at `eslint.config.mjs:1066-1090`: `projectService` is enabled for `files: ["**/*.ts"]` to serve `@typescript-eslint/no-unnecessary-type-assertion` (and the `no-misused-promises` / `no-floating-promises` block below it), so one ESLint process holds a TypeScript program for every package's tsconfig at once. This is a hypothesis; the first step is to confirm it with a heap profile or by running with the typed block disabled.

## Acceptance criteria

- The dominant contributor to the full-lint heap is identified by measurement and stated in the PR body.
- The full `pnpm lint` peak live heap (largest post-mark-compact figure under `--trace-gc`) drops well below the 5993 MB baseline, by a route that keeps every rule enforced on every file it covers today. Candidate routes: lint per package in separate processes in the `__ALL__` arm of the Lint job so programs are released between packages; a dedicated lint tsconfig; narrowing the typed block's `files`.
- No rule is disabled or narrowed to buy the memory, and no `eslint-disable` is added.
- `--max-old-space-size` in `lint` and `lint:files` is lowered to match the new measured peak plus margin, and the PR body records the new figure.
