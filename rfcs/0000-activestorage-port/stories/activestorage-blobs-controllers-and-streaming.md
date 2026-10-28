---
title: "Port the blob redirect and proxy controllers and the Streaming concern"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-controllers
packages: ["activestorage"]
deps: ["activestorage-routes-and-controller-concerns"]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/controllers/active_storage/blobs/redirect_controller.rb` (16),
`blobs/proxy_controller.rb` (26), and
`app/controllers/concerns/active_storage/streaming.rb` (75), which includes
`ActionController::Live` (`:10`), serves byte ranges
(`send_blob_byte_range_data`, `:14-54`, multipart ranges included) and streams
with `send_stream` (`:56-70`); trails has `ActionController::Live`
(`packages/actionpack/src/action-controller/metal/live.ts`). Tests:
`test/controllers/blobs/redirect_controller_test.rb` (11),
`proxy_controller_test.rb` (17).

## Acceptance criteria

- Both controllers and `Streaming` are ported; the proxy streams through
  `Live`'s async body (CLAUDE.md "`$!` is passed explicitly, and a response
  body is iterated async").
- Single and multipart `Range` requests answer Rails' status, headers and
  body.
- Both test files pass.
