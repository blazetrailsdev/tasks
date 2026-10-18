---
title: "test-request-assign-parameters-binary-data-b"
status: in-progress
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9046
claim: "2026-10-18T22:36:41Z"
assignee: "assertion-kinds-fold-actionpack-private-assert-helpers"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::TestRequest#assign_parameters`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:134`) is
`data_stream = StringIO.new(data.b)`, applied to both the multipart arm (`:113`,
`ENCODER.build_multipart`) and the encoded-form arms. The port
(`packages/actionpack/src/action-controller/test-case.ts`, `assignParameters`) applies
`b(data)` only on the non-multipart arm and carries
`@missingRailsName b — PERMANENT`, which `classifyPair` files convergeable, so
the naming gate reports `receipt-on-convergeable` once actioncontroller is enrolled.

Moving `b()` to the `StringIO.new` argument double-encodes the multipart body
(`TestCaseTest > fixture file upload` reds: 45142 vs 68916 bytes), because
`buildMultipart` (`packages/rack/src/multipart.ts:100`) answers a latin1 "binary"
JS string, and `b` (`ruby-compat/src/string/b.ts`) UTF-8-encodes a string. Ruby's
`.b` on a binary String is identity.

## Acceptance criteria

- `assignParameters` passes `b(data)` to `new StringIO` as Rails does, for both arms,
  with the multipart body unchanged (e.g. `buildMultipart` answers bytes, which `b`
  passes through).
- The `@missingRailsName b` receipt is removed and the fixture-upload tests stay green.
