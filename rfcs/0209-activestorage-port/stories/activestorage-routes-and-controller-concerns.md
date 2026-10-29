---
title: "Port ActiveStorage's routes, BaseController and the controller concerns"
status: ready
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: as-controllers
packages: ["activestorage"]
deps: ["activestorage-blob-and-downloader", "activestorage-variation-and-variants"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/config/routes.rb` (84) draws the blob, representation, disk and direct
upload routes under `ActiveStorage.routes_prefix` and defines the `direct`
helpers `rails_representation`, `rails_blob`, `rails_storage_proxy`,
`rails_storage_redirect` and the `resolve` blocks (`:18-40`); trails' mapper
has `direct` and `resolve` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`).
`app/controllers/active_storage/base_controller.rb` (10) and the concerns
`set_current.rb` (15), `set_blob.rb` (20), `disable_session.rb` (12),
`file_server.rb` (21). Tests: `test/urls/rails_storage_proxy_url_test.rb` (5),
`rails_storage_redirect_url_test.rb` (5).

## Acceptance criteria

- The routes are drawn by the engine as Rails draws them, honouring
  `draw_routes` and `routes_prefix`; the `direct` / `resolve` helpers answer
  Rails' URLs.
- `BaseController` and the four concerns are ported; `SetBlob` awaits
  `Blob.find_signed!`.
- The two url test files pass.
