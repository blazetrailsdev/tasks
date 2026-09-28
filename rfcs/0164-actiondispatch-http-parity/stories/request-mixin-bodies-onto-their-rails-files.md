---
title: "Move Request's and Response's inlined mixin bodies to the files that mirror their Rails modules"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: ["http-config-seats-onto-mattr-accessor"]
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

`pnpm parity:api:extra --package actiondispatch` prints an "Inlined module
bodies" report: Ruby module members whose TS body sits on an including class's
file instead of the file that mirrors the module. For this RFC's files:

- `http/request.ts` holds, from `http/url.rb`: `domain`, `host`,
  `hostWithPort`, `isStandardPort`, `optionalPort`, `port`, `portString`,
  `protocol`, `rawHostWithPort`, `serverPort`, `standardPort`, `subdomain`,
  `subdomains`, `url`; from `http/mime_negotiation.rb`: `isParamsReadable`,
  `setFormat`; from `http/parameters.rb`: `params`; from
  `http/filter_parameters.rb`: the constructor; from
  `http/permissions_policy.rb`: `permissionsPolicy`
- `http/response.ts` holds `_cacheControl` from `http/cache.rb` and
  `isLocationFilterMatch` from `http/filter_redirect.rb`

This is also why `pnpm parity:api` scores seven `http/url.rb` rows
declaration-only.

Separately, 18 `Request` members are scored "moved": the cookie-jar readers
(`cookieJar`, `isHaveCookieJar`, `keyGenerator`, `signedCookieSalt`, …,
`useCookiesWithMetadata`) that Rails defines in the `class Request` reopening at
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/cookies.rb:12-91`,
and `flash`, which `middleware/flash.rb:315-317` prepends as
`Flash::RequestMethods`. `PassNotFound` and `rawHost` on `request.ts` are
novel.

CLAUDE.md § "Module mixins" is the shape: a `this`-typed function in the
module's file, assigned to the class.

## Acceptance criteria

- Each member above lives in the file mirroring its Rails module and is
  assigned onto `Request` / `Response`; the cookie readers live in
  `middleware/cookies.ts` and `flash` in `middleware/flash.ts`, touching only
  those files' `Request` reopening.
- `PassNotFound` and `rawHost` are removed or shown to be Rails names the
  comparer misses (then filed against RFC 0167 (gates)).
- `pnpm parity:api` reports `http/url.rb` 38/38; `parity:api:extra` lists no
  inlined body and no moved name on `request.ts` or `response.ts`.
