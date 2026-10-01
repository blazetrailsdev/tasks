---
title: "Integration::Session re-declares TestProcess members instead of including the module"
status: draft
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
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

`ActionDispatch::Integration::Session` is
`include TestProcess, RequestHelpers, Assertions`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:95`)
and overrides only `cookies` (`:114`); `IntegrationTest::Behavior` is
`include TestProcess::FixtureFile` (`:651`).

trails' `packages/actionpack/src/action-dispatch/testing/integration.ts` does
not include the module. It imports the functions under aliases (`:24-29`) and
re-declares them by hand, each casting `this as unknown as TestProcessHost`:
`get flash` (`:367-370`, with an invented `if (!this.request) return new
FlashHash()` guard `test_process.rb:44-46` does not have), `get redirectToUrl`
(`:376-378`), `assigns` (`:542-544`), `fileFixtureUpload` and
`fixtureFileUpload` (`:546-562`). `session` is not delegated at all.

trails#8339 converged `ActionController::TestCase` onto
`include(TestCase, TestProcess)` with the `Included<>` type side
(`packages/actionpack/src/action-controller/test-case.ts`); there the members
are calls (`tc.flash()`), where the integration class still exposes getters.

## Acceptance criteria

- The integration `Session` includes `TestProcess` (and `IntegrationTest`
  includes `TestProcess.FixtureFile`) through `include()` / `Included<>`; the
  hand-written wrappers and the `TestProcessHost` casts are deleted, and only
  `cookies` stays as the override `integration.rb:114` defines.
- `flash` has no guard Rails lacks.
- Call sites in `integration.test.ts` and `controller/integration.test.ts`
  use the module's members.
