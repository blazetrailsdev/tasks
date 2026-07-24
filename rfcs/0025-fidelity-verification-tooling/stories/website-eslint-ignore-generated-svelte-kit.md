---
title: "website: add generated .svelte-kit/** to the eslint global ignores"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Observed while shipping #5272 (`packages/website/scripts/tsconfig.json`). Running
`svelte-kit sync` in `packages/website` (required for `dev`/`build`, and the state
of any real dev checkout) generates `packages/website/.svelte-kit/`, which is
gitignored (`packages/website/.gitignore:1`) but NOT eslint-ignored.

`pnpm exec eslint packages/website` then reports 44 errors, all in generated
output — e.g.:

```text
packages/website/.svelte-kit/types/src/routes/frontiers/learn/[tutorial]/proxy+page.ts
  1:1  error  Do not use "@ts-nocheck" ...  @typescript-eslint/ban-ts-comment
```

CI's `Lint` job does not currently hit this because it lints without a prior
`svelte-kit sync`, so the noise is local-only today — but it makes
`eslint packages/website` unusable as a local check and is a latent CI break the
moment any job syncs before linting.

The global `ignores` array in `eslint.config.mjs:53-63` already carves out
`packages/website/static/**` and `packages/website/build/**` — `.svelte-kit/**`
belongs in the same list.

## Acceptance criteria

- `packages/website/.svelte-kit/**` added to the global `ignores` in
  `eslint.config.mjs`.
- With `.svelte-kit/` present (run `pnpm exec svelte-kit sync` in
  `packages/website` first), `pnpm exec eslint packages/website` reports zero
  errors from generated files.
- Hand-written website sources still lint (verify the count of linted files does
  not drop for `packages/website/src/**`).
