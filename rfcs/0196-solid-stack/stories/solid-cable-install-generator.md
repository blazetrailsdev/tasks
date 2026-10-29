---
title: "Port solid_cable:install"
status: done
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cable"]
deps: ["port-solid-cable-adapter"]
deps-rfc: []
est-loc: 150
pr: trails#9449
claim: "2026-10-29T19:31:14Z"
assignee: "ar-types-for-solid-stack-casts"
blocked-by: null
closed-reason: null
priority: 8
---

## Context

`vendor/solid_cable/v3.0.7/lib/generators/solid_cable/install/install_generator.rb` and its
`templates/` copy config/cable.yml and db/cable_schema.rb into the app. trailties' generator base already has
Thor-style `generate` / `template`
(`packages/trailties/src/generators/actions.ts`, `base.ts`).

## Acceptance criteria

- The install generator is ported at its Rails name, with its templates, and
  its gem test (if any) passes.
- Running it in a generated app produces the Rails files.
