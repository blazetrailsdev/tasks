---
title: "Port the rest of mime/respond_to_test.rb and mime/accept_format_test.rb"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-view-and-helper-test-fixtures",
    "converge-mime-responds-collector-responses-hash",
    "respond-to-negotiated-format-never-reaches-lookup-context",
    "delete-invented-action-dispatch-respond-to-and-csrf-modules",
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

`vendor/rails/v8.0.2/actionpack/test/controller/mime/respond_to_test.rb` (922
lines) is one class, `RespondToControllerTest` (`:328`), with 66 tests.
`packages/actionpack/src/action-controller/controller/mime/respond-to.test.ts`
matches 30; 35 are missing — 2 in Rails lines 250-499, 14 in 500-749 and 19 in
750-917 — and one (`variant not set regular unknown format`) sits in
`metal/implicit-render.trails.test.ts`. The missing ones are mostly variants
(`request.variant`, `format.html.phone`, `any` with variants), `respond_to`
with layouts read from `fixtures/respond_to` and `fixtures/layouts`, custom
types, `xhr`, internally forced formats, missing templates and invalid
variants. RFC 0141's `port-respond-to-controller-variant-tests`
covers the variant subset; this story takes whatever it does not.

`respond-to.test.ts` also imports the invented
`action-dispatch/respond-to.ts`, which
`delete-invented-action-dispatch-respond-to-and-csrf-modules` removes.

`vendor/rails/v8.0.2/actionpack/test/controller/mime/accept_format_test.rb`
(6 tests: `StarStarMimeControllerTest` `:14-26`, `MimeControllerLayoutsTest`
`:69-89`) is absent; it reads `fixtures/star_star_mime` and `fixtures/layouts`.

## Acceptance criteria

- Every remaining `RespondToControllerTest` test is ported in Rails order; the
  one reported in `metal/implicit-render.trails.test.ts` moves here if it is the
  port, and is ported fresh if not.
- `controller/mime/accept-format.test.ts` exists and ports all six tests.
- Both files report complete in `pnpm parity:test --package actioncontroller`.
