---
title: "Port dispatch/mount_test.rb and routing/custom_url_helpers_test.rb"
status: draft
updated: 2026-09-27
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two Rails files with no trails file:

- `vendor/rails/v8.0.2/actionpack/test/dispatch/mount_test.rb`:
  `TestRoutingMount` (`:52-106`), 10 tests — mounting at the root path and at
  paths with non-word characters, `SCRIPT_NAME` (including nested), `scope`,
  the shorthand form, `via:`, not matching similar paths, and the app name
  generated for an engine mounted in `resources`
- `vendor/rails/v8.0.2/actionpack/test/dispatch/routing/custom_url_helpers_test.rb`:
  `TestCustomUrlHelpers` (`:148-339`), 8 tests — `direct` and `resolve`
  (`Mapper::CustomUrls`) for paths and URLs, including them from a concern,
  and the `RuntimeError` for either inside a `scope`

## Acceptance criteria

- `dispatch/mount.test.ts` and `dispatch/routing/custom-url-helpers.test.ts`
  port every test in Rails order.
- Both report complete in `pnpm parity:test --package actiondispatch`.
