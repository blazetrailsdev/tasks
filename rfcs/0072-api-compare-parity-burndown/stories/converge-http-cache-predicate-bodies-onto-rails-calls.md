---
title: "converge-http-cache-predicate-bodies-onto-rails-calls"
status: closed
updated: 2026-07-30
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps:
  - converge-http-cache-predicates-onto-is-prefix
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded"
---

## Context

Renaming `hasLastModified`/`hasDate`/`hasEtag` to `isLastModified`/`isDate`/`isEtag`
(RFC 0072 story `converge-http-cache-predicates-onto-is-prefix`) made the wide
call-set comparison finally _match_ these three predicates to their Rails
counterparts, which exposed three real body divergences in
`packages/actionpack/src/action-dispatch/http/cache.ts`:

- `isLastModified` (cache.ts:219) and `isDate` (cache.ts:222) call the local
  `hdrSet` helper (cache.ts:87-89) instead of `hasHeader`. `hdrSet` exists only
  because `ResponseCacheHost` (cache.ts:81-85) declares `hasHeader?` as
  **optional** and falls back to a `getHeader(key) !== undefined` check.
  Rails calls `has_header?` directly
  (`vendor/rails/actionpack/lib/action_dispatch/http/cache.rb:77`, `:91`).
- `isEtag` (cache.ts:233) reads `this.getHeader(ETAG)`. Rails is
  `def etag?; etag; end` (`cache.rb:127`) — it goes through the `etag` reader
  and returns the ETag string, not a boolean. Our `etag` is a class getter on
  `Response` (cache.ts:210) and not callable as a module function, and
  `Response` declares `readonly isEtag: boolean`
  (`packages/actionpack/src/action-dispatch/http/response.ts:347`).

All three are currently baselined in
`scripts/api-compare/call-mismatches-wide-exclude/actiondispatch/http/cache.json`
with equivalent-path reasons. They are equivalent, but the baseline entries are
the thing to burn down.

## Acceptance criteria

- `hasHeader` becomes required on `ResponseCacheHost` (or the predicates call it
  directly some other faithful way) and `hdrSet` is deleted; every object passed
  as a `ResponseCacheHost` supplies `hasHeader`.
- `isEtag` reaches the ETag through the `etag` reader, matching `cache.rb:127`.
  Decide and document whether the return type becomes `string | undefined`
  (Rails-faithful) or stays boolean.
- The three entries (`date? -> has_header?`, `last_modified? -> has_header?`,
  `etag? -> etag`) are removed from the wide-call baseline, and
  `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` is clean
  (watch for newly STALE siblings, e.g. `weak_etag? -> etag`).
- No test name is added, removed or reworded.
