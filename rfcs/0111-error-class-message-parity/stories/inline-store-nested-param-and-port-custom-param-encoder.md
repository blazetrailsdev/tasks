---
title: "inline-store-nested-param-and-port-custom-param-encoder"
status: claimed
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 53
pr: null
claim: "2026-09-11T13:26:35Z"
assignee: "time-with-zone-change-lacks-zone-and-offset-options"
blocked-by: null
closed-reason: null
---

## Context

Split out of `burn-the-missing-throw-arms-in-actiondispatch` to hold that PR
under the LOC ceiling.

- `packages/actionpack/src/action-dispatch/http/param-builder.ts#storeNestedParam`
  delegates to a module-level `storeNestedParamImpl(self, ...)` that Rails does
  not have (`vendor/rails/actionpack/lib/action_dispatch/http/param_builder.rb:62-156`
  is one private method). Its missing-throw arm row is the
  `raise InvalidParameterError, "Invalid encoding for parameter: #{v.scrub}"`
  at `param_builder.rb:113-126` (the depth-0 String encoding check), plus the
  four raises that live in the impl rather than the method body. Inlining is
  a ~220-line reindent; the JS spelling of `valid_encoding?` is a lone
  surrogate test (`/\p{Cs}/u`), and `scrub` is `.replace(/\p{Cs}/gu, "�")`.
- `Request#GET` / `#POST` (`http/request.rb:395-434`) pass
  `encoding_template: Request::Utils::CustomParamEncoder.action_encoding_template(self, path_parameters[:controller], path_parameters[:action])`
  to `ParamBuilder.from_query_string` / `from_pairs` / `from_hash`. trails has no
  `CustomParamEncoder` (`request/utils.rb`), so `GET` carries a
  `@missingRailsArgs from_query_string` receipt pointing at this story. `POST`
  still routes through `parseFormattedParameters` + `normalizeEncodeParams`
  rather than `ParamBuilder.from_pairs` / `from_hash`.

## Acceptance criteria

- [ ] `storeNestedParam` holds the Rails body; `storeNestedParamImpl` is deleted.
- [ ] The depth-0 invalid-encoding raise is ported with Rails' class and message,
      covered by a test that fails on baseline.
- [ ] `CustomParamEncoder.action_encoding_template` is ported and `GET`/`POST`
      pass it; the `@missingRailsArgs` receipt on `GET` is removed.
- [ ] `pnpm parity:api:arms:throws:tighten` writes `http/param-builder.ts` to 0.
