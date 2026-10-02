---
title: "Move the trails-only PostsController tests out of controller/test-case.test.ts; drop TestCase's optional-name constructor"
status: ready
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
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

`packages/actionpack/src/action-controller/controller/test-case.test.ts` mirrors
`vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb`, but it still
opens with a trails-only `PostsController` and a first
`describe("TestCaseTest")` over it (sub-describes "HTTP verb methods",
"request options", "response inspection", "assertResponse",
"assertRedirectedTo", "assertContentType", "assertHeader", "flash",
"session persistence", "Metal controller support", "process helpers"). None of
those test names exists in `test_case_test.rb`; they sit in the Rails-named
file and describe, ahead of the real `class TestCaseTest` port, and count as
`extra (TS only)` in `parity:test`.

The parent story (`test-case-process-invented-headers-and-env-options`) removed
`process`'s `headers:` / `env:` options and `TestCase#responseBody`,
`#parsedBody` and `#reset`, and deleted the five tests that existed only to
exercise them. It left the rest of the block in place because moving ~375
lines counts twice against the PR LOC ceiling.

Also left: `TestCase`'s `constructor(name?: string)`
(`packages/actionpack/src/action-controller/test-case.ts`), which makes
Minitest's required `name` optional so ~40 call sites write `new TestCase()`.
`ActionController::TestCase` defines no `initialize`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:356-372`).

## Acceptance criteria

- The trails-only `PostsController` and its `describe` move to
  `packages/actionpack/src/action-controller/test-case.trails.test.ts` (or are
  deleted where a Rails-named test in the same file already covers the
  behaviour), under a describe that is not `TestCaseTest`.
- `controller/test-case.test.ts` holds only tests named in `test_case_test.rb`.
- `TestCase` declares no constructor of its own; each `new X()` call site
  passes the name `ActiveSupport::TestCase` requires.
