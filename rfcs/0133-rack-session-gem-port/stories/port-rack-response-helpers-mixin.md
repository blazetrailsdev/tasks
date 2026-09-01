---
title: "Model Rack::Response::Helpers as one mixin so Response and Raw stop duplicating its bodies"
status: draft
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Response::Raw` is `include Helpers`
(`vendor/rack/lib/rack/response.rb:376`), so a real `Raw` answers every member
of `Rack::Response::Helpers` (`response.rb:180-370`) — `content_type` /
`content_type=`, `media_type`, `location` / `location=`, `etag` / `etag=`,
`cache_control` / `cache_control=`, `cache!`, `do_not_cache!`, the full status
predicate set (`informational?`, `redirection?`, `client_error?`,
`server_error?`, `created?`, `accepted?`, `no_content?`, …), and the rest.

trails' `ResponseRaw` (`packages/rack/src/response.ts:373`) carries a hand-picked
subset: five status predicates that predate this work, plus `addHeader`,
`setCookie`, `deleteCookie` and the `setCookieHeader` accessor pair, added by
`port-rack-response-raw` (PR #7326) because `Persisted#commit_session` needs
exactly those. Everything else Helpers defines is missing.

The gap is invisible to every gate: `@noRailsEquivalent` scores EXTRA surface,
and `parity:api:extra` cannot see surface that is absent. So nothing tracks it
today.

Note the underlying cause is that `packages/rack/src/response.ts` does not model
`Helpers` as a mixin at all — `Response` duplicates its bodies inline and `Raw`
duplicates a subset of them a second time. The convergent fix is one
`Helpers` module both classes take through `include()` / `Included<>` from
`@blazetrails/activesupport` (CLAUDE.md, "Module mixins"), which closes the gap
and deletes the duplication in one move rather than adding a third copy.

## Acceptance criteria

- `Rack::Response::Helpers` exists as one module in
  `packages/rack/src/response.ts` at its Rails name, with the members
  `response.rb:180-370` defines.
- `Response` and `ResponseRaw` both take it through the mixin idiom; neither
  keeps an inline duplicate of a Helpers body.
- `pnpm parity:api --package rack` shows no regression, and rack's ported suite
  (`packages/rack/src/response.test.ts`, including the `Rack::Response::Raw`
  block at `:717-751`) stays green.
