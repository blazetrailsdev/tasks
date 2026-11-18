---
title: "rack-etag-digests-only-array-bodies"
status: draft
updated: 2026-11-18
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::ETag#call` (`vendor/rack/.../lib/rack/etag.rb`) digests any body that
responds to `each`; trails' `packages/rack/lib/etag.ts:30` only digests when
`Array.isArray(body)`. A full-stack request through the trails middleware
stack (`packages/trailties/lib/application/default-middleware-stack.ts:140`,
`stack.use(ETag, "no-cache")`) therefore never sets `ETag` for a rendered
controller response, and answers `cache-control: no-cache`.

Surfaced by turbo-rails `test/frames/frame_request_controller_test.rb`
"frame requests get a unique etag", parked as `it.skip` in
`packages/turbo/test/frames/frame-request-controller.test.ts`.

## Acceptance criteria

- `Rack::ETag` digests a non-Array body that answers `each`, as Rack does.
- The turbo test "frame requests get a unique etag" is un-skipped and passes.
