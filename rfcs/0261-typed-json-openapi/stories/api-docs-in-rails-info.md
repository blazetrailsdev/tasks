---
title: "trailties: an API tab on /rails/info rendered from the OpenAPI document"
status: draft
updated: 2026-11-27
rfc: "0261-typed-json-openapi"
cluster: follow-ons
packages: [trailties, trails-tsc]
deps: [openapi-json-schema-converter]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Follow-ons. Rails' dev-only `/rails/info/routes`
(`vendor/rails/v8.0.5.2/railties/lib/rails/info_controller.rb`; ours is
`packages/trailties/lib/info-controller.ts`) lists routes with no shapes. In
development, add an API view beside it that renders `tmp/openapi.json`. It shows
each route's request and response schemas next to the route table, and links
the raw document so external tools (Postman, Insomnia, Scalar) can import it.

## Acceptance criteria

- [ ] `/rails/info/api` renders every operation with its schemas, and is only
      mounted where `/rails/info` is (development).
- [ ] With no document generated, the page says how to generate one instead of
      raising.
- [ ] `/rails/info/api.json` serves the raw document.
- [ ] Rendering is server-side, with no bundled third-party viewer.
