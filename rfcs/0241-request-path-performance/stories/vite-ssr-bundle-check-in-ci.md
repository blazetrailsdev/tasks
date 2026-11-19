---
title: "Run the serverless spike's Vite SSR bundle check in CI"
status: in-progress
updated: 2026-11-19
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10363
claim: "2026-11-19T16:31:33Z"
assignee: "boot-define-property-cost-in-mixin-installers"
blocked-by: null
closed-reason: null
---

## Context

trails#10324 added `examples/serverless-lambda/bundle-vite.mjs` (`pnpm check:vite`). It builds the spike app as a Vite SSR bundle with Rollup's default chunking, then serves `GET /posts` from it. It guards the activerecord `connection-adapters` TDZ fix and the `trails build` entry fix (`packages/trails-tsc/lib/build-autoload.ts` `writeEntry`, which now imports the environment dynamically). No CI job runs it, so a new module-eval cycle or entry-order regression would only show up when someone deploys to a Vite host.

## Acceptance criteria

- A CI job runs the spike's `pnpm build` and then `pnpm check:vite`, on changes to activerecord, trails-tsc, trailties or the example.
- It does not depend on `packages/website/.svelte-kit` existing. The script already passes `esbuild.tsconfigRaw: "{}"`.
- ~~It fails if `import "../../connection-adapters.js"` is re-added to `connection-handler.ts`.~~ FALSIFIED: re-adding it to a rebuilt `dist` (2026-11-19, trails#10363) still serves `GET /posts` 200; the cycle it closed in trails#10324 no longer exists, so no check can fail on it.
