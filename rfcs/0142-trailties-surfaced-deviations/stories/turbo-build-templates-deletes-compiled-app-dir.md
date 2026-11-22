---
title: "turbo build:templates deletes the compiled dist/app tree"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

`packages/turbo/package.json` `build:templates` runs `rm -rf dist/app && mkdir -p dist/app && cp -R app/views dist/app/`.
`tsc` (rootDir `lib`) emits `lib/app/**` (channels, jobs, helpers, models) to `dist/app/**`, so the template step deletes it.
A built `@blazetrails/turbo` then fails on `import "@blazetrails/turbo/engine"` with ERR_MODULE_NOT_FOUND for
`dist/app/channels/turbo/streams-channel.js` (found 2026-11-21 booting a `trails new` app; trails#10547).
Rails ships `app/channels`, `app/jobs` and `app/views` side by side (`vendor/turbo-rails/v2.0.23/app/`).

## Acceptance criteria

- `build:templates` removes only `dist/app/views` before copying views.
- After `pnpm --filter @blazetrails/turbo build`, `dist/app/channels/turbo/streams-channel.js` exists and `import "@blazetrails/turbo/engine"` loads in plain node.
