---
title: "Port the renderers, format-render and small rendering test files"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "port-actionpack-view-and-helper-test-fixtures",
    "renderers-registry-and-renderers-class-attribute",
    "streaming-and-api-rendering-fold-invented-helpers",
  ]
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

Twelve small Rails files under `vendor/rails/v8.0.2/actionpack/test/controller/`,
none present in trails at its convention path:

| Rails file                    | Tests | Notes                                                                                                                |
| ----------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `renderers_test.rb`           | 3     | `RenderersTest` (`:60-80`), `Renderers.add`                                                                          |
| `metal/renderers_test.rb`     | 2     | `RenderersMetalTest` (`:37-44`)                                                                                      |
| `api/renderers_test.rb`       | 3     | reported misplaced in `controller/base.test.ts`, but that `render plain` is a trails-only test with a colliding name |
| `api/implicit_render_test.rb` | 2     | `ImplicitRenderAPITest`                                                                                              |
| `render_js_test.rb`           | 2     |                                                                                                                      |
| `render_xml_test.rb`          | 7     | `RenderXmlTest` (`:57-97`)                                                                                           |
| `render_to_string_test.rb`    | 5     | 4 real; `TestController#test_*` (`:27`) is a phantom                                                                 |
| `output_escaping_test.rb`     | 3     |                                                                                                                      |
| `localized_templates_test.rb` | 5     | reads `fixtures/localized`                                                                                           |
| `form_builder_test.rb`        | 1     | `default_form_builder`                                                                                               |
| `chunked_test.rb`             | 1     |                                                                                                                      |
| `streaming_test.rb`           | 1     |                                                                                                                      |

## Acceptance criteria

- Each file exists at its convention path and ports every Rails test in order,
  including `api/renderers_test.rb`'s `test_render_plain` (`:45`);
  `controller/base.test.ts` is not edited (RFC 0162 owns it).
- `pnpm parity:test --package actioncontroller` reports all twelve complete
  (apart from the phantom row RFC 0167 (gates) removes).
