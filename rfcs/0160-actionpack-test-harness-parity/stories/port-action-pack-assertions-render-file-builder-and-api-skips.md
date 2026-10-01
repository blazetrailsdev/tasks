---
title: "port-action-pack-assertions-render-file-builder-and-api-skips"
status: draft
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps:
  - api-redirect-to-override-and-head-response-are-invented
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-action-pack-assertions-routing-and-redirect-skips` ported seven of the
twelve `it.skip` stubs in
`packages/actionpack/src/action-controller/controller/action-pack-assertions.test.ts`
and converged `TestCase#assertRedirectedTo` / `assertResponse` onto the
`ResponseAssertions` port. Six stubs remain, each on a blocker that was still
open:

- `test_render_file_absolute_path` and `test_render_file_relative_path`
  (`vendor/rails/v8.0.2/actionpack/test/controller/action_pack_assertions_test.rb:146,151`)
  render actionpack's `README.rdoc` (`:91-97`,
  `File.expand_path("../../README.rdoc", __dir__)`) and assert
  `/\A= Action Pack/`. trails' actionpack has no such file and the Unit Tests
  job has no `vendor/rails`, so the fixture has to be vendored into
  `packages/actionpack/` first.
- `test_with_routing_works_with_api_only_controllers` (`:166`) needs
  `ApiOnlyController < ActionController::API` (`:136-144`) to answer
  `redirect_to new_route_url`. trails' `API`
  (`packages/actionpack/src/action-controller/api.ts`) includes only
  `StrongParameters`; without `UrlFor` (`action_controller/api.rb:115-144`) the
  generated helper throws in `optimizeRoutesGeneration` on an undefined
  `defaultUrlOptions`. Tracked by
  `api-redirect-to-override-and-head-response-are-invented`.
- `ActionPackHeaderTest`'s three `rendering xml ...` tests (`:504-517`) render
  `test/hello_xml_world.builder`, which waits on 0140's
  `builder-template-handler-and-actionpack-builder-fixtures`.

## Acceptance criteria

- Each of the six stubs is replaced by its Rails test body once its blocker
  lands, with `ApiOnlyController` and the `hello_xml_world*` /
  `render_file_*` actions added to the file's controllers.
- `pnpm parity:test --package actioncontroller` reports
  `controller/action_pack_assertions_test.rb` complete.
