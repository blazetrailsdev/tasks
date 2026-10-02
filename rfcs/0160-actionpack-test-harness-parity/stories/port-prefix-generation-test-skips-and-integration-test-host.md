---
title: "Port prefix_generation_test.rb's skipped tests, fixtures and verify_redirect on IntegrationTest"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/dispatch/prefix-generation.test.ts`
ports `vendor/rails/v8.0.2/actionpack/test/dispatch/prefix_generation_test.rb`
only partly. trails#8381 made `BlogEngine` and `RailsApplication` real
`Engine` subclasses in both describes, which was the blocker; what is left:

- 21 tests are still `it.skip` with empty bodies: every `[APP]` and
  `[OBJECT]` test, the four `[ENGINE]` URL-generation tests
  (`prefix_generation_test.rb:159-178`), and `generating path inside engine`
  (`:392-395`).
- The fixtures those tests need are unported: `Post` (`:8-23`),
  `InsideEngineGeneratingController` / `OutsideEngineGeneratingController`
  (`:70-126`), `EngineObject` / `AppObject` (`:133-143`), the
  `RailsApplication.routes.define_mounted_helper(:main_app)` force-draw
  (`:68`), `include BlogEngine.routes.mounted_helpers` (`:156`), the `setup`
  that resets `default_url_options` (`:151-155`), and `::PostsController`
  (`:377-385`).
- Both classes are `< ActionDispatch::IntegrationTest` (`:26,335`) with
  `def app; RailsApplication.instance; end`. The trails file is not an
  `IntegrationTest`: it builds a Rack env in a local `get(app, path)` helper
  and reads the response tuple.
- `verify_redirect` (`:456-460`) is three assertions; the trails redirect
  tests inline two and drop `assert_equal "", response.body`.

## Acceptance criteria

- Both describes run on `IntegrationTest` with `app` answering
  `RailsApplication.instance()`, and the local `get` helper is gone.
- `verifyRedirect(url, status = 301)` is ported with all three assertions and
  the redirect tests call it.
- Every fixture listed above is ported at its Rails name, and each of the 21
  skipped tests is ported with its Rails name verbatim. A test that cannot
  pass stays `it.skip` with the gap filed against the code it exposes.
- `pnpm parity:test:assertions` stays green.
