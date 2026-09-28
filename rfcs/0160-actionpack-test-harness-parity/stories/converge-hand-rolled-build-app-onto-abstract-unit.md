---
title: "Converge the hand-rolled test apps onto the abstract_unit harness"
status: done
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support"]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8220
claim: "2026-09-28T16:29:17Z"
assignee: "add-flash-types-defines-no-reader-or-helper"
blocked-by: null
closed-reason: null
---

## Context

Before the harness existed, each test file assembled its own app. The copies in
files this RFC owns are:

- `packages/actionpack/src/action-controller/controller/integration.test.ts`
- `packages/actionpack/src/action-dispatch/testing/integration.test.ts`

Rails gives both one shape: `ActionDispatch::IntegrationTest.build_app`
(`vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb:118-176`) over
`RoutedRackApp` (`:97-116`), and `RoutingTestHelpers` (`:305-349`) for route-set
tests.

The other four copies (`ssl.test.ts:8`, `show-exceptions.test.ts`,
`host-authorization.test.ts`, `content-security-policy.test.ts`) sit in files the
middleware and HTTP RFCs own, and converge in those RFCs' test stories.

## Acceptance criteria

- Neither file above defines its own app builder; both call the harness at the
  Rails names.
- `pnpm parity:test --package actioncontroller` and `--package actiondispatch`
  report no drop in matched tests for either file.
