---
title: "Port controller/renderer_test.rb"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "renderer-normalize-env-and-moved-readers",
    "controller-render-converges-onto-abstract-controller-render",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/renderer_test.rb` (221 lines)
is one class, `RendererTest < ActiveSupport::TestCase` (`:6`), with 25 tests
covering `ActionController::Base.renderer`, creating renderers `for` and from a
controller, `with_defaults`, rendering with locals, assigns, helpers, formats
and a renderable object, custom env keys in and outside
`RACK_KEY_TRANSLATION`, asset URLs, and how `env[:https]` / `env[:script_name]`
interact with the controller's `default_url_options` and `force_ssl`.
There is no `controller/renderer.test.ts` in trails
(`packages/actionpack/src/action-controller/renderer.test.ts` exists, outside
the convention path, and credits nothing).

## Acceptance criteria

- `controller/renderer.test.ts` ports all 25 tests in Rails order.
- Tests in `action-controller/renderer.test.ts` that duplicate a Rails test are
  deleted; the rest move to `renderer.trails.test.ts`.
- `pnpm parity:test --package actioncontroller` reports the file 25/25.
