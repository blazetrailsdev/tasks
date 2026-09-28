---
title: "Fold the invented streaming and API-rendering helpers back into their Rails methods"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps: ["controller-render-converges-onto-abstract-controller-render"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actioncontroller` lists:

- `isStreamingRequest` and `prepareStreamingHeaders`
  (`packages/actionpack/src/action-controller/metal/streaming.ts:1,5`). Rails has
  one private method, `Streaming#_render_template(options)`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/streaming.rb:172-181`):
  if `options.delete(:stream)`, it sets `headers["cache-control"] ||= "no-cache"`
  and calls `view_renderer.render_body`; otherwise `super`.
- `renderForApi` (`packages/actionpack/src/action-controller/api/api-rendering.ts:32`),
  re-exported from `action-controller/index.ts`. Rails'
  `ApiRendering#render_to_body(options = {})`
  (`action_controller/api/api_rendering.rb:13`) is `_process_options(options);
super`. trails' version hand-builds `json:` / `plain:` bodies and content
  types, which is the same dispatcher RFC 0140 removes from `Base#render`.

## Acceptance criteria

- `metal/streaming.ts` defines `_renderTemplate` with Rails' body and nothing
  else; the two helpers are gone.
- `api/api-rendering.ts` defines `renderToBody` as Rails does; `renderForApi`
  is gone from it and from `index.ts`.
- `pnpm parity:api:extra --package actioncontroller` lists neither file.
