---
title: "The trails CLI has no TypeScript loader, so db seed cannot import app models"
status: in-progress
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: 12
pr: 7295
claim: "2026-08-31T14:16:57Z"
assignee: "cli-cannot-load-typescript-app-code"
blocked-by: null
closed-reason: null
---

## Context

The `trails` CLI runs app code under plain node with no TypeScript loader, so
any app file that imports another app file cannot be loaded.

`trails db seed` on `examples/twitter-app`:

```text
Error [ERR_MODULE_NOT_FOUND]:
  url: '.../examples/twitter-app/src/config/application.js'
```

`db/seeds.ts` imports `../src/config/application.js` — the `.js` specifier
TypeScript requires for a `.ts` source under `moduleResolution: Node16`, which
the generated `tsconfig.json` sets. Node resolves that literally, finds no
`.js` on disk, and fails. Any seeds file that touches a model hits this.

The same shape affects `trails server`: `server/application.ts`'s
`resolveController` and `loadRoutes` `await import()` the `src/**/*.ts` paths
directly (`packages/trailties/src/server/application.ts`, the `candidates`
arrays), which only works because the dev server runs inside Vite. Outside
Vite — which is where `trails db seed` and `trails routes` run — there is no
transform.

`examples/twitter-app` works around it with a `db/seed.ts` entry point run
through `tsx`, and a `pnpm smoke` script that does the same.

Rails has no analogue because Ruby has no build step; the closest is that
`rails runner` / `rails db:seed` load the app through the same boot path as
the server. The trails equivalent is that every CLI command that executes app
code must install the same loader the server uses.

## Acceptance criteria

- `trails db seed` runs a `db/seeds.ts` that imports app models.
- Every CLI command that loads app code (`db seed`, `routes`, `console`,
  `runner` if added) installs a TypeScript loader, or the CLI documents a
  single supported way to run it.
- `examples/twitter-app` drops `db/seed.ts` and its `TODO`, and its
  `db:seed` script becomes plain `trails db seed`.
