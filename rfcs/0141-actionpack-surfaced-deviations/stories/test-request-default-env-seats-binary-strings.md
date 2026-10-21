---
title: "TestRequest DEFAULT_ENV seats .b binary strings as Rails does"
status: draft
updated: 2026-10-21
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `ActionDispatch::TestRequest::DEFAULT_ENV`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/test_request.rb:11-13`)
seats `"test.host".b`, `"0.0.0.0".b` and `"Rails Testing".b`. In trails, `b`
answers a `Uint8Array` (trails#9191), and the Rack env readers
(`ActionDispatch::Http::URL#raw_host_with_port`, `host`, `remote_addr`) treat
these values as JS strings. So `packages/actionpack/src/action-dispatch/testing/test-request.ts`
seats plain strings and leaves out the `.b`.

## Acceptance criteria

- `DEFAULT_ENV` seats `b("test.host")`, `b("0.0.0.0")` and `b("Rails Testing")`, as Rails does.
- Every Rack/ActionDispatch reader of `HTTP_HOST`, `REMOTE_ADDR` and
  `HTTP_USER_AGENT` accepts an ASCII-8BIT String (`Uint8Array`). Each reads it
  as Rails does, through `String` methods the binary method table answers.
- The actionview and actionpack test-case suites stay green.
