---
title: "Port the missing redirect, send_file, required_params and metal tests"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "action-controller-config-seats-onto-activesupport-primitives",
    "send-data-and-send-file-do-not-render",
    "metal-and-abstract-base-missing-methods",
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

Partly ported files under `vendor/rails/v8.0.2/actionpack/test/controller/`:

- `redirect_test.rb`: `RedirectTest` (`:223-626`) is 39/49 plus 14 missing —
  6 in Rails lines 250-499 and 8 in 500-626: redirect to a record and
  polymorphic redirects, `redirect_to` with a block (assigns, out-of-scope,
  accepted options), four unsafe-redirect arms (malformed URL,
  protocol-relative `//` and `///`, illegal header character), `url_from`
  with and without a fallback, and `redirect_to` instrumentation
- `send_file_test.rb`: `SendFileTest` (`:88-283`) is 24/26 real tests; six more
  rows are `SendFileController#test_send_file_headers_*` actions (`:31-67`) that
  the extractor counts (removed by RFC 0167 (gates))
- `required_params_test.rb`: 1 missing in `ActionControllerRequiredParamsTest`
- `metal_test.rb`: `MetalControllerInstanceTests` (`:12-33`), 2 missing —
  `metal.test.ts` holds 28 tests with no Rails counterpart

## Acceptance criteria

- Every missing test is ported in Rails order under its Rails class.
- `metal.test.ts`'s extra tests move to `metal.trails.test.ts` (it exists) or
  are deleted as duplicates.
- The four files report complete (apart from the phantom rows) with no extra.
