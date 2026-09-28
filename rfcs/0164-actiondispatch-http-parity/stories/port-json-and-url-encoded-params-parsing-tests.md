---
title: "Port json_params_parsing_test.rb and url_encoded_params_parsing_test.rb"
status: draft
updated: 2026-09-28
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  ["port-actionpack-abstract-unit-test-support", "parse-formatted-parameters-guard-and-parser-key"]
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

Two Rails files under `vendor/rails/v8.0.2/actionpack/test/dispatch/request/`
with no trails file:

- `json_params_parsing_test.rb`: `JsonParamsParsingTest` (`:21-96`, 9) and
  `RootLessJSONParamsParsingTest` (`:143-183`, 6) — JSON params for
  `application/json`, `jsonrequest` and `problem+json`, unregistered media
  types, `nil`s stripped from collections, parse errors logged and raised,
  `raw_post`, non-object JSON, and custom JSON MIME types with synonyms
- `url_encoded_params_parsing_test.rb`: `UrlEncodedParamsParsingTest`
  (`:21-134`, 10) — nested hashes and arrays, `+` and `%20`, and empty keys

Both post through an integration session to a controller that echoes `params`.

## Acceptance criteria

- `dispatch/request/json-params-parsing.test.ts` and
  `url-encoded-params-parsing.test.ts` port every test in Rails order.
- Both report complete in `pnpm parity:test --package actiondispatch`.
