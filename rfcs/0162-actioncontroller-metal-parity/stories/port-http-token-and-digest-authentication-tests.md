---
title: "Port http_token_authentication_test.rb and http_digest_authentication_test.rb"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "restructure-http-authentication-into-basic-digest-and-token",
    "port-actionpack-abstract-unit-test-support",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two Rails files, absent from trails at their convention paths
(`pnpm parity:test --package actioncontroller`):

- `vendor/rails/v8.0.2/actionpack/test/controller/http_token_authentication_test.rb`:
  `HttpTokenAuthenticationTest` (`:50-214`), 22 tests —
  `authenticate_or_request_with_http_token`, `token_and_options` parsing of
  quoted and unquoted params, `Token token=` vs `Bearer`, and the
  `WWW-Authenticate` challenge
- `vendor/rails/v8.0.2/actionpack/test/controller/http_digest_authentication_test.rb`:
  `HttpDigestAuthenticationTest` (`:57-247`), 21 tests — nonce and opaque
  validation, `ha1` passwords, `authenticate_or_request_with_http_digest` and
  stale nonces. One of them (`validate_digest_response should fail with nil
returning password_procedure`) sits in `metal/http-authentication.test.ts`.

`controller/http-basic-authentication.test.ts` is the precedent (15/15).

## Acceptance criteria

- `controller/http-token-authentication.test.ts` and
  `controller/http-digest-authentication.test.ts` port every test in Rails order;
  the misplaced digest test moves.
- Both report complete in `pnpm parity:test --package actioncontroller`.
