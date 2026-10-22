---
title: "Port solid_queue:install"
status: ready
updated: 2026-10-22
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: ["port-solid-queue-supervisor"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/lib/generators/solid_queue/install/install_generator.rb` and its
`templates/` copy config/queue.yml, config/recurring.yml, db/queue_schema.rb and bin/jobs and set the production queue adapter into the app. trailties' generator base already has
Thor-style `generate` / `template`
(`packages/trailties/src/generators/actions.ts`, `base.ts`).

## Acceptance criteria

- The install generator is ported at its Rails name, with its templates, and
  its gem test (if any) passes.
- Running it in a generated app produces the Rails files.
