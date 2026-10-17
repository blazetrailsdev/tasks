---
title: "AppGenerator runs the Solid install generators unless --skip-solid"
status: draft
updated: 2026-10-17
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["trailties"]
deps:
  [
    "lookup-store-resolves-solid-cache-store",
    "solid-cache-install-generator",
    "solid-queue-install-generator",
    "solid-cable-install-generator",
  ]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/app-generator.ts:625-640` writes a
`config/cable.ts` whose production adapter is `redis` with `REDIS_URL`. That
matches Rails' bare `cable.yml.tt`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/cable.yml.tt`).
A Rails 8 app is switched to Solid by the gems' install generators
(`solid_cache:install`, `solid_queue:install`, `solid_cable:install`), which
`AppGenerator` runs unless `--skip-solid` is passed.

Generator infrastructure (`generate`, `template`) is in
`packages/trailties/src/generators/actions.ts`.

## Acceptance criteria

- The install generators themselves are ported by
  `solid-{cache,queue,cable}-install-generator`. This story is the
  `AppGenerator` wiring: `--skip-solid`, and running them in the same place and under the same options as Rails.
- A generated app's production config names the Solid adapters and cache
  store, with no Redis URL. The devcontainer generator adds no Redis or
  memcached service unless asked.
