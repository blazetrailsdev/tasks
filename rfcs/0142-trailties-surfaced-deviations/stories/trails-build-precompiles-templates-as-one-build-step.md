---
title: "trails build also precompiles templates, so an app has one build step before assets:precompile"
status: ready
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "trails-tsc"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails build` (`packages/trailties/lib/commands/build.ts`) only writes the
autoload manifests to `.trails/autoload/`. Template precompilation is a
separate binary, `trails-tsc-views build` (`packages/trails-tsc`), so every app
chains the two by hand:

- `examples/cloudflare-worker/scripts/build.sh` and
  `examples/serverless-lambda/scripts/build.sh`: `trails-tsc-views build`, then
  `TRAILS_ENV=production node bin/trails build`, then esbuild.
- `examples/chatter/package.json`: `build` is `trails-tsc-views build --views
app/views && vite build`, and never runs `trails build`, so the Docker image
  walks autoload paths at boot.
- The generated app Dockerfile
  (`packages/trailties/lib/generators/trails/app/templates/Dockerfile.tt:52-56`)
  runs `pnpm run build`, then `bin/trails assets:precompile`.

Rails' analogue is the deploy compile phase in its generated Dockerfile:
`bundle exec bootsnap precompile app/ lib/`, then `assets:precompile`
(`vendor/rails/v8.0.5.2/railties/lib/rails/generators/rails/app/templates/Dockerfile.tt`).
`trails build` is that bootsnap step. It should own all code-side compilation;
assets stay on `assets:precompile`.

## Acceptance criteria

- `trails build` also precompiles the app's `.tse` templates (the work
  `trails-tsc-views build` does today), in-process, for the booted app's view
  paths.
- The generated app's `build` script and Dockerfile reach both through a single
  `trails build`, followed by `assets:precompile`.
- `examples/cloudflare-worker`, `examples/serverless-lambda` and
  `examples/chatter` call `trails build` instead of `trails-tsc-views build`.
  Chatter's image then ships the autoload manifests.
- `trails-tsc-views build` stays available as the standalone tool.
