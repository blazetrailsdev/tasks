---
title: "Port chunked_test.rb, streaming_test.rb and form_builder_test.rb"
status: ready
updated: 2026-10-12
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-renderers-and-format-render-tests`: its PR ported nine of the
twelve files and stopped at the LOC ceiling. Three files under
`vendor/rails/v8.0.2/actionpack/test/controller/` remain, none present in trails
at its convention path under
`packages/actionpack/src/action-controller/controller/`:

| Rails file             | Tests | trails file            |
| ---------------------- | ----- | ---------------------- |
| `chunked_test.rb`      | 1     | `chunked.test.ts`      |
| `streaming_test.rb`    | 1     | `streaming.test.ts`    |
| `form_builder_test.rb` | 1     | `form-builder.test.ts` |

All three were written and passed locally before the split, so the remaining
work is typing, not behaviour:

- `chunked_test.rb:22-31` posts `params: TestInput.new("foo=bar")`, a `StringIO`
  with `size` undefined (`:17-19`). `IntegrationRequestOptions.params`
  (`packages/actionpack/src/action-dispatch/testing/integration.ts`) is typed
  `Record<string, unknown> | string`, so the IO needs the type widened; the
  request already works at run time. `undef_method :size` ports as
  `Object.defineProperty(TestInput.prototype, "size", { value: undefined })`,
  which makes `rbObjRespondTo(input, "size")` false in
  `packages/rack/src/mock-request.ts`. `IntegrationTest#app` and
  `TestResponse#parsedBody` are typed `unknown`, so `@app.routes.draw` and
  `response.parsed_body["content_length"]` need a cast today.
- `streaming_test.rb:12-18` calls `response.stream.write` / `.close`.
  `Response#stream` (`packages/actionpack/src/action-dispatch/http/response.ts`)
  is typed `unknown`, so the test needs a cast to `ResponseBuffer` today. Rails
  nests the class in `module ActionController`; `parity:test` expects the
  describe `StreamingResponseTest`, without the module prefix.
- `form_builder_test.rb:5-18` is `default_form_builder SpecializedFormBuilder`
  in a class body and one `assert_equal` on `@controller.default_form_builder`.
  It ports with no source change.

## Acceptance criteria

- Each file exists at its convention path and ports every Rails test in order.
- `Response#stream`, `IntegrationTest#app` and `TestResponse#parsedBody` are
  typed so the three tests need no cast, or the casts that remain are filed.
- `pnpm parity:test --package actioncontroller` reports the three files
  complete, and `pnpm parity:test:assertions` stays green.
