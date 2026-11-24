---
title: "trails new generates an app whose image runs compiled JavaScript"
status: draft
updated: 2026-11-23
rfc: "0258-ship-compiled-javascript"
cluster: null
packages: ["trailties"]
deps: ["long-running-commands-boot-from-the-build-entry"]
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

The generated app runs source at run time. `bin/trails.tt` hardcodes
`config/application.ts`, and `Dockerfile.tt` ends with
`CMD ["npx", "rackup", "config.ts"]`. Every new trails app therefore ships a
TypeScript loader to production.

## Acceptance

- `bin/trails.tt` (app and plugin) resolves `config/application.{ts,js}`
  beside itself, so the same file works from source and from `dist/`.
- The generated `build` script emits to `dist/`, `bin/` included.
  `Dockerfile.tt` runs it, then `trails build` inside `dist/`, and copies `dist/` plus
  production-only dependencies into the runtime stage. `CMD` runs the
  compiled server under `node --no-experimental-strip-types`.
- `tsx` and `typescript` are devDependencies only, and absent from the
  runtime stage.
- Existing apps migrate with `trails app:update`. The PR lists the
  resulting diff for a stock app as the upgrade note.
- Generator tests assert the templates. The behaviour is proven by
  `generated-app-boots-compiled-without-tsx`.
