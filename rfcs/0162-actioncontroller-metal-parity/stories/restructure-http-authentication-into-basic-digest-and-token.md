---
title: "Restructure HttpAuthentication into Basic, Digest and Token, and port Token"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: []
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

Rails' `ActionController::HttpAuthentication`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/http_authentication.rb`)
is three modules, each with module functions and a `ControllerMethods`:

- `Basic` (`:69`): `authenticate`, `decode_credentials`, `encode_credentials`,
  `authentication_request`, …
- `Digest` (`:189`): `authenticate`, `validate_digest_response`,
  `expected_response`, `ha1`, `encode_credentials`, `decode_credentials_header`,
  `decode_credentials`, `authentication_header`, `authentication_request`,
  `secret_token`, `nonce`, `validate_nonce`, `opaque`
- `Token` (`:425`): `authenticate`, `token_and_options` (`:494`),
  `token_params_from` (`:502`), `params_array_from` (`:507`),
  `rewrite_param_values` (`:512`), `raw_params` (`:519`), `encode_credentials`
  (`:539`), `authentication_request` (`:555`); its `ControllerMethods` has
  `authenticate_or_request_with_http_token` (`:438`),
  `authenticate_with_http_token` (`:446`) and
  `request_http_token_authentication` (`:452`)

trails' `packages/actionpack/src/action-controller/metal/http-authentication.ts`
flattens `Basic` and `Digest` into one module, so names Rails shares between
them come out prefixed — `digestAuthenticate` (`:152`), `encodeDigestCredentials`
(`:206`), `decodeDigestCredentials` (`:227`), `digestAuthenticationRequest`
(`:252`) — which `pnpm parity:api:extra` scores novel. `Token` is missing
entirely (8 rows, plus 3 on `base.rb`): it lives as `TokenAuth` in
`packages/actionpack/src/action-dispatch/http-authentication.ts:60`, an invented
file (no `action_dispatch/http_authentication.rb` exists) that also carries
`BasicAuth` (`:8`) and `DigestAuth` (`:135`) — 7 novel and 7 moved names.
`metal/http-authentication.ts:12` imports from it.

Three call baseline rows sit in `actioncontroller/metal/http-authentication.json`.

## Acceptance criteria

- `metal/http-authentication.ts` exports `HttpAuthentication` with `Basic`,
  `Digest` and `Token`, each holding its Rails functions under their Rails
  names and its own `ControllerMethods`; `Base` includes the three
  `ControllerMethods` as Rails does.
- `action-dispatch/http-authentication.ts` and its test are deleted; callers
  and the two `index.ts` barrels use the Rails modules.
- `pnpm parity:api --package actioncontroller` reports
  `metal/http_authentication.rb` 33/33 and no token rows on `base.rb`;
  `parity:api:extra` lists neither file; `http-authentication.json` is empty.
