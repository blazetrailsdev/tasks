---
title: "Port solid_cache:install"
status: draft
updated: 2026-10-17
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cache"]
deps:
  - port-solid-cache-entry-model-and-store
  - lookup-store-resolves-solid-cache-store
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_cache/v1.0.7/lib/generators/solid_cache/install/install_generator.rb` and its
`templates/` copy config/cache.yml and db/cache_schema.rb and point production at :solid_cache_store into the app. trailties' generator base already has
Thor-style `generate` / `template`
(`packages/trailties/src/generators/actions.ts`, `base.ts`).

## Acceptance criteria

- The install generator is ported at its Rails name, with its templates, and
  its gem test (if any) passes.
- Running it in a generated app produces the Rails files.
