---
title: "Port Rack::Cache::CacheControl, Rack::Cache::Request and Rack::Cache::Headers"
status: draft
updated: 2026-09-28
rfc: "0000-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["enroll-rack-cache-in-compare-tooling"]
deps-rfc: []
est-loc: 380
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These are the gem's three leaves. Paths are under `vendor/rack-cache/v1.17.0/lib/rack/cache/`.

- **`cache_control.rb` (209 lines).** `CacheControl < Hash` (`:6`). `initialize(value=nil)`
  (`:7`) parses a `Cache-Control` header through private `parse` (`:198-207`).
  That method lower-cases each directive name, strips spaces, and stores
  `value || true`. The directive readers are `public?` (`:18`), `private?`
  (`:32`), `no_cache?` (`:49`), `no_store?` (`:78`), `max_age` (`:110`),
  `shared_max_age` (`:123`), `reverse_max_age` (`:137`), `must_revalidate?`
  (`:166`) and `proxy_revalidate?` (`:180`). `to_s` (`:184`) re-serializes.
  It **is a Hash**, and `Request#no_cache?` indexes it directly
  (`cache_control['no-cache']`, `request.rb:29`). So port it over trails' Ruby
  Hash (`packages/rack/src/headers.ts:3` is `Headers extends Hash<string, string>`,
  the model), not a plain object.
- **`request.rb` (33 lines).** `Request < Rack::Request` (`:12`): `request_method`
  reads `@env['REQUEST_METHOD']` directly (`:17-19`, deliberately bypassing
  method-override), `cache_control` memoizes a `CacheControl` over
  `HTTP_CACHE_CONTROL` (`:22-24`), and `no_cache?` (`:28-31`).
  `packages/rack/src/request.ts` is the superclass.
- **`headers.rb` (21 lines).** Port only the Rack 3 arm (`:2-8`):
  `Headers = ::Rack::Headers` and `Rack::Cache.Headers(headers)` →
  `Headers[headers]`. The `rescue LoadError` arm (`:9-20`,
  `Rack::Utils::HeaderHash`) is Rack < 3, and trails' `rack` is `v3.1.14` (RFC
  Non-goals). `Rack::Cache.Headers` is a module function named like the
  constant. Check `docs/ruby-ts-conventions.md` for how a capitalized Ruby
  method name is spelled before you pick one.

Mind the predicate rule (CLAUDE.md "Predicates"). `no_cache?` returns
`cache_control['no-cache'] || env['HTTP_PRAGMA'] == 'no-cache'`, a **value**,
not a boolean. So does `CacheControl#public?` (`self['public']`). Read each body
before you type its return. `pnpm parity:api:predicates` gates the spelling.

Tests: `test/cache_control_test.rb` (156 lines, 27 cases) and
`test/request_test.rb` (19 lines, 3 cases), ported as
`packages/rack-cache/src/cache-control.test.ts` and `request.test.ts`.

## Acceptance criteria

- [ ] `src/cache-control.ts`, `src/request.ts` and `src/headers.ts` port the
      three files at their Ruby names, and `CacheControl` is a Hash subclass.
- [ ] `cache-control.test.ts` (27) and `request.test.ts` (3) port every case,
      with Rails-identical names.
- [ ] `pnpm parity:api` reports `cache_control.rb`, `request.rb` and the Rack 3
      half of `headers.rb` complete, and `parity:api:calls` /
      `parity:api:calls:args` add no row.
