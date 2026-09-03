---
title: "HttpAuthentication's four *ControllerLike/*Host duck types replace Rails' include of ControllerMethods on Metal"
status: draft
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the last criterion of
`converge-actioncontroller-metal-header-seat-onto-response` in #7424.

Rails' `HttpAuthentication::Basic` and `::Digest` are modules whose
`ControllerMethods` are mixed into the controller
(`actionpack/lib/action_controller/metal/http_authentication.rb:69-119` for
Basic, `:180-232` for Digest), so `authentication_request`
(`http_authentication.rb:138-142`) and `authentication_header`
(`:277-279`) are instance methods and `self` IS an
`ActionController::Metal` — `headers`, `status` and `response_body` are
`Metal`'s delegations (`metal.rb:179-196`).

trails instead declares four invented duck-type interfaces in
`packages/actionpack/src/action-controller/metal/http-authentication.ts` —
`BasicAuthControllerLike` (`:27`), `BasicControllerHost` (`:107`),
`DigestControllerLike` (`:209`) and `DigestControllerHost` (`:217`) — and the
functions take the controller as a parameter or a `this` type over those
structural shapes rather than over `Metal`.

That widening is what let the `WWW-Authenticate` writes stay broken until
PR #7424: `headers` was typed `Record<string, string>`, so writing
`controller.headers["WWW-Authenticate"] = …` type-checked against the
interface while setting a dead own property on the real `Rack::Headers`
seat. #7424 narrowed the field to `Headers` and moved the writes to
`.set(...)`, but the interfaces themselves are still there, and they still
admit any object that structurally matches.

## Converged shape

The settled trails idiom for a Ruby `include` is a `this`-typed function
assigned to the class (CLAUDE.md, "Module mixins"). Type these functions
`this: Metal` (or take `controller: Metal`), delete the four `*Like` /
`*Host` interfaces, and let the tests construct a real controller — the
canonical `ActionController::Base` subclass the other actioncontroller tests
use — instead of the `{ request, headers, status, responseBody }` literals in
`metal/http-authentication.test.ts` and
`controller/http-basic-authentication.test.ts`.

## Acceptance criteria

- [ ] `http-authentication.ts` declares no `BasicAuthControllerLike`,
      `BasicControllerHost`, `DigestControllerLike` or `DigestControllerHost`;
      the ported bodies are `this`-typed over `Metal` as
      `http_authentication.rb:69-119,180-232` mixes them in.
- [ ] Both auth test files drive a real controller rather than an object
      literal double; test names are unchanged.
- [ ] `pnpm parity:api:extra --package actionpack` loses the four names.
- [ ] The actioncontroller suites stay green.
