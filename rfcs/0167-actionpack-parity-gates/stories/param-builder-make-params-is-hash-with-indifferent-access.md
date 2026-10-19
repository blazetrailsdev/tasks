---
title: "param-builder-make-params-is-hash-with-indifferent-access"
status: closed
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "PERMANENT: ParamBuilder#makeParams stays a null-prototype plain object by repo-owner ruling 2026-10-18; the two HashWithIndifferentAccess assert_instance_of assertions are receipted in scripts/test-compare/assertion-receipts.ts"
---

## Context

`ActionDispatch::ParamBuilder#make_params` returns `ActiveSupport::HashWithIndifferentAccess.new` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/param_builder.rb:162-164`). trails' `makeParams` (`packages/actionpack/src/action-dispatch/http/param-builder.ts:249-251`) returns `Object.create(null)`. So the `assert_instance_of ActiveSupport::HashWithIndifferentAccess` in "simple query string" and "nested parameters" (`vendor/rails/v8.0.2/actionpack/test/dispatch/param_builder_test.rb:12-22`) cannot be ported, and actiondispatch keeps two assertion-count and two kind rows.

Changing the return type reaches every request parameter hash, so `paramsHashType` (`param-builder.ts:259`) and the consumers that read params as plain objects have to be checked with it.

## Acceptance criteria

- `makeParams` answers a `HashWithIndifferentAccess`, as Rails' does, and `paramsHashType` accepts it.
- The two param_builder tests carry Rails' `assertInstanceOf(HashWithIndifferentAccess, …)` and pass, and the request/params suites stay green.
