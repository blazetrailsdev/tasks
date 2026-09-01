---
title: "expires_in/fresh_when compose the cache-control header instead of merging into the one response.cache_control hash"
status: draft
updated: 2026-09-01
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds cache directives in a HASH on the response and renders it once.
`ActionDispatch::Http::Cache::Response#cache_control` is that hash, and both
conditional-GET writers merge into it:

- `actionpack/lib/action_controller/metal/conditional_get.rb:290-302`
  `expires_in` — `response.cache_control.delete(:no_store)`, then
  `response.cache_control.merge!(max_age:, public:, must_revalidate:,
stale_while_revalidate:, stale_if_error:, immutable:)` pulling each through
  `options.delete`, then `options.delete(:private)` and
  `response.cache_control[:extras] = options.map { |k, v| "#{k}=#{v}" }`.
- `conditional_get.rb:137-155` `fresh_when` — `response.cache_control.delete(
:no_store)` up front, `response.cache_control[:public] = true if public`, and
  `response.cache_control.merge!(cache_control)` for the `cache_control:` kwarg.

trails has no such hash. `packages/actionpack/src/action-controller/base.ts
:893-898` composes the header string directly —
`parts = ["max-age=#{seconds}"]`, push `"public"`, push `"must-revalidate"`,
`join(", ")` — and `freshWhen` (`base.ts:853-880`) sets `etag`,
`last-modified` and a bare `cache-control: public` header. Consequences beyond
the two dropped `merge!` calls: `expiresIn` takes only `{public, mustRevalidate}`
so `stale_while_revalidate`, `stale_if_error`, `immutable` and the `extras`
passthrough are unreachable; `freshWhen` has no `cache_control:` kwarg at all;
`no_store` is never deleted, so a prior `expires_now` is not undone; and the
last writer clobbers the header instead of merging directives into it.

Surfaced while adjudicating PR #7339 (RFC 0129): the `expires_in -> merge!` and
`fresh_when -> merge!` rows in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/base.json` are
NOT ruby-compat Hash-call-form work — the receiver is the response's
cache-control hash, which does not exist here — so they were left baselined with
that reason rather than converged.

## Acceptance criteria

- `ActionDispatch::Http::Cache::Response#cache_control` is modelled as the
  directives hash Rails keeps on the response, rendered to the
  `cache-control` header at the same point Rails renders it
  (`http/cache.rb`'s `set_conditional_cache_control!` / `handle_conditional_get!`).
- `expiresIn` mirrors `conditional_get.rb:290-302` — the `no_store` delete, the
  six-key `merge!` sourced through `options.delete`, the `:private` delete, and
  the `extras` list — with Rails' parameter names and defaults.
- `freshWhen` mirrors `conditional_get.rb:137-155`, including the
  `cacheControl` kwarg and the `public` arm, in Rails' branch order.
- The two `merge!` rows are deleted from
  `call-mismatches-exclude/actioncontroller/base.json` by hand (only-shrink,
  never a reseed); stale marks narrowed with `pnpm parity:api:calls:tighten`.
- Rails' own conditional-GET tests are ported under their verbatim names; the
  actionpack suite and `pnpm parity:api` / `parity:test` deltas stay
  non-negative.
