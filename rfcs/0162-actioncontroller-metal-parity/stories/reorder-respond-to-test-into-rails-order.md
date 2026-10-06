---
title: "Reorder respond-to.test.ts into respond_to_test.rb order"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/controller/mime/respond-to.test.ts`
ports all 66 tests of `RespondToControllerTest`
(`vendor/rails/v8.0.2/actionpack/test/controller/mime/respond_to_test.rb:328-922`)
and `parity:test` reports it complete, but the `it` blocks are not in Rails
order. The file opens with the variant tests (Rails `:733-917`), then
`custom constant` (`:636-646`), then `html` (`:357`) onward, and ends with
`missing templates`, `invalid variant` and
`variant not set regular unknown format` (`:714-731`). trails#8522 inserted the
25 tests it added next to their Rails neighbours but did not move the existing
ones, because a full reorder would have exceeded that PR's LOC ceiling.

The `RespondToController` actions at the top of the file are already in Rails
order (`respond_to_test.rb:16-313`).

## Acceptance criteria

- The `it` blocks in `respond-to.test.ts` appear in the order of the `test_*`
  methods in `respond_to_test.rb:350-921`, with no test body, name or assertion
  changed: the PR is a pure move.
- `pnpm parity:test --package actioncontroller` still reports
  `controller/mime/respond_to_test.rb` 66/66 and the assertion ratchet is green.
