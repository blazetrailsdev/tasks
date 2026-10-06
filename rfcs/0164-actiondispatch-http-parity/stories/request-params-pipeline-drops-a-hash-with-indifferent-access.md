---
title: "Request params pipeline drops a HashWithIndifferentAccess a parser returns"
status: draft
updated: 2026-10-06
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Request::Utils::ParamEncoder.normalize_encode_params`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/request/utils.rb:50-67`)
takes any `Hash` (a `HashWithIndifferentAccess` included) and rebuilds it as an
`ActiveSupport::HashWithIndifferentAccess`. So a custom parameter parser may
return `hash.with_indifferent_access`, as `webservice_test.rb:70`
(`test_register_and_use_json_simple`) does.

In trails the request pipeline is plain-object only:
`ParamBuilder#fromHash` (`packages/actionpack/src/action-dispatch/http/param-builder.ts:99-110`)
and `RequestUtils.normalizeEncodeParams` / `checkParamEncoding`
(`packages/actionpack/src/action-dispatch/request/utils.ts:40-52`) walk
`Object.values(params)`, so a parser returning activesupport's
`HashWithIndifferentAccess` yields no request parameters at all (the controller
sees only `controller` / `action`). `ParameterParser`'s declared return type
(`http/parameters.ts:13`) is `Record<string, unknown>`.

The port of `test_register_and_use_json_simple` in
`packages/actionpack/src/action-controller/controller/webservice.test.ts` is
parked `it.skip` under a `BLOCKED:` line naming this story. Sibling:
`parameters-holds-a-plain-object-not-hash-with-indifferent-access` covers the
`ActionController::Parameters` side.

## Acceptance criteria

- [ ] `normalizeEncodeParams`, `checkParamEncoding` and `CustomParamEncoder`
      take a `Hash` / `HashWithIndifferentAccess` wherever Rails' `when Hash`
      arm does.
- [ ] "register and use json simple" is un-skipped and green.
