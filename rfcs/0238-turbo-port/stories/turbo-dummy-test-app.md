---
title: "Port turbo-rails' test/dummy app as the @blazetrails/turbo test app"
status: draft
updated: 2026-11-12
rfc: "0238-turbo-port"
cluster: turbo
packages: [turbo, activerecord]
deps: [hotwire-vite-claude-md-ruling]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every turbo-rails test runs against `vendor/turbo-rails/v2.0.23/test/dummy`:
its models (`Message`, `Article`, `Comment`, `Board` and the rest under
`app/models`), the controllers and views the helper and controller tests
render, `config/routes.rb`, and `db/schema.rb`. It is split out of
`turbo-package-helpers-and-turbo-stream-format` so this infrastructure
is sized on its own. That story, `turbo-broadcasts-and-streams-channel`,
both broadcastable stories and `turbo-test-helpers` all reuse this app.

## Acceptance criteria

- `packages/turbo/test/dummy/` mirrors the gem's tree file for file,
  with models, controllers, views (as TSE), routes and schema ported
  verbatim. No bespoke models or tables are added.
- The schema loads through the settled one-schema test setup, and the app
  boots under the trails test helper that mirrors the gem's `test_helper.rb`.
- `packages/turbo` exists with an empty `lib/turbo-trails.ts` entry, so
  that this story can land first.

## Verification

- `pnpm vitest run packages/turbo/test/dummy` passes a boot smoke test
  that loads every dummy model.
