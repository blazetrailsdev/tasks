---
title: "Port Cache::Request.strict_freshness accessor, retire CacheConfig"
status: draft
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::Cache::Request` declares
`mattr_accessor :strict_freshness, default: false`
(`vendor/rails/actionpack/lib/action_dispatch/http/cache.rb:12`) and reads it
back as `Request.strict_freshness` inside `fresh?` (`:47`). Rails wires it
from `config.action_dispatch.strict_freshness`.

trails holds the flag on a bespoke object instead:

```ts
export const CacheConfig = { strictFreshness: false };
```

(`packages/actionpack/src/action-dispatch/http/cache.ts:27`), read by
`fresh()` as `CacheConfig.strictFreshness`. `CacheConfig` has no Rails
counterpart, and the accessor pair is unported: after PR #5404 converged the
`Cache::Response` writers, `api:compare --package actiondispatch` scores
`http/cache.rb` at 26/28 (93%) with `strict_freshness` and
`strict_freshness=` the ONLY two remaining misses.

The landed exemplar for a `mattr_accessor` declared inside `included do … end`
is `MimeNegotiation.ignoreAcceptHeader` — a static property on the module's
class (`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`),
read by `useAcceptHeader()`.

## Acceptance criteria

- `strictFreshness` lives under the Rails name on a `Request` class module in
  `cache.ts`, mirroring how `MimeNegotiation.ignoreAcceptHeader` carries
  `mattr_accessor :ignore_accept_header`.
- `CacheConfig` is DELETED, not left as a parallel spelling; its callers
  (`fresh()` plus any test setup) read the new accessor.
- `http/cache.rb` reaches 28/28 in `api:compare --package actiondispatch`.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags.
