---
title: "ActionController::Renderer#render hand-dispatches options instead of instance.render_to_string"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
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

Rails' `ActionController::Renderer#render`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/renderer.rb:129-137`)
builds an `ActionDispatch::Request` from `env_for_request`, instantiates
`controller.new`, calls `set_request!` / `set_response!(controller.make_response!(request))`,
and returns `instance.render_to_string(*args)`. `render_to_string` is an alias
(`:138`).

trails' `Renderer#render` (`packages/actionpack/src/action-controller/renderer.ts`)
never instantiates the controller. It hand-dispatches options
(`merged.html`, and so on) with hardcoded content types such as
`"text/html; charset=utf-8"`, and keeps invented `_lastStatus` /
`_lastContentType` / `status` / `contentType` readers. This is the sibling of the
`Base#render` hand-dispatcher that trails#8212 removed.

After trails#8212, `Base#renderToString` is `ActionController::Rendering#render_to_string`
over `render_to_body`, and it answers `string | Promise<string>` because the
ActionView arm is async. So the converged `Renderer#render` is async for
non-renderer options.

## Acceptance criteria

- `Renderer#render` follows `renderer.rb:129-137`: a request from
  `env_for_request`, `controller.new`, `setRequestBang`, `setResponseBang`, then
  `instance.renderToString(...args)`.
- `renderToString` is the alias.
- The invented option dispatch and the `status` / `contentType` / `_last*` surface
  are deleted.
- The existing `renderer.test.ts` Rails ports stay green (awaited).
