---
title: "AssertionResponse#code_from_name lets Rack's status_code raise"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AssertionResponse#code_from_name` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertion_response.rb:40-42`) is `GENERIC_RESPONSE_CODES[name] || Rack::Utils.status_code(name)`. For an unknown Symbol, `Rack::Utils.status_code` raises `ArgumentError, "Unrecognized status code :bogus"` (`vendor/rack/v3.1.14/lib/rack/utils.rb:589-592`). So in Rails, `assert_response :bogus` raises Rack's error, not "Invalid response name".

trails' `codeFromName` (`packages/actionpack/src/action-dispatch/testing/assertion-response.ts`) wraps `rackStatusCode` in a try/catch and returns `null`. That is an invented rescue arm.

## Acceptance criteria

- `codeFromName` drops the try/catch, so Rack's `ArgumentError` propagates.
- Tests that expect "Invalid response name" for an unknown name (`assertion-response.test.ts`, `response-assertions.test.ts`, `test-case.trails.test.ts`) assert Rack's message instead.
