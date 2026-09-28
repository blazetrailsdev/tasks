---
title: "Remove TestCase's invented assert helpers and metal/testing's recycle"
status: in-progress
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: trails#8211
claim: "2026-09-28T11:36:15Z"
assignee: "port-actionpack-view-and-helper-test-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actioncontroller` lists four novel names on
`packages/actionpack/src/action-controller/test-case.ts`: `assertContentType`
(`:244`), `assertHeader` (`:251`), `assertFlash` (`:267`) and `assertNoFlash`
(`:286`). `ActionController::TestCase`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb`) has none of
them. Rails tests assert on the response directly, e.g.
`assert_equal "text/html", @response.media_type` and
`assert_equal "bar", flash[:foo]`.

`packages/actionpack/src/action-controller/metal/testing.ts:1` also exports a
novel `recycle`, which `recycleBang` (`:7`) wraps. Rails' `Testing::Functional`
(`action_controller/metal/testing.rb`) has `recycle!` only.

The integration twin of this (`integration.ts:620` and friends) is
`remove-invented-integration-test-assertions` (RFC 0141). This story does not
touch `integration.ts`.

## Acceptance criteria

- The four helpers are deleted and every call site is rewritten to the assertion
  the Rails test at that site makes.
- `recycle` is folded into `recycleBang`, whose body matches `recycle!`.
- `pnpm parity:api:extra --package actioncontroller` lists no novel name in
  `test-case.ts` or `metal/testing.ts`.
- `pnpm parity:test --package actioncontroller` shows no drop in matched tests.
