---
title: "url-for-parameters-keys-cross-into-camelcase-options"
status: ready
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Parameters` keys are Strings in Rails and in trails. Rails'
`RoutingUrlFor#ensure_only_path_option`
(`vendor/rails/actionview/lib/action_view/routing_url_for.rb:139-145`) calls
`options.key?(:only_path)` and `options[:only_path] = ...` on a Parameters. Those
convert the Symbol to the String `"only_path"`. So trails'
`packages/actionview/src/routing-url-for.ts` `ensureOnlyPathOption` sets
`params.set("only_path", ...)`, and that is faithful (trails#7991).

Rails then reaches `UrlFor#full_url_for`
(`vendor/rails/actionpack/lib/action_dispatch/routing/url_for.rb:185-188`):
`options.to_h.symbolize_keys.reverse_merge!(url_options)`. `symbolize_keys` turns
`"only_path"` / `"script_name"` / `"trailing_slash"` into the Symbols every
downstream reader uses. trails spells those Symbols camelCase (`onlyPath`,
`scriptName`, `trailingSlash`: `docs/ruby-ts-conventions.md`,
`packages/actionpack/src/action-dispatch/http/url.ts:11-26`). trails'
`fullUrlFor` (`packages/actionpack/src/action-dispatch/routing/url-for.ts:54-81`,
`coerceHashOrParameters` at `:160-164`) instead passes `params.toH()` through
with its snake_case String keys. So `urlFor(params)` from a view writes
`"only_path"`, and nothing downstream reads it. The result is a full URL (or a
`?only_path=true` query), where Rails produces a path.

RFC 0149's rule makes a Hash bare-keyed and camelCase. It does not yet say how
a String-keyed Parameters crosses into that Hash at `url_for.rb:185`, the one
place Rails symbolizes a Parameters for url generation. The
`route-set-url-for-path-for-port` story converges the Hash arm only.

## Acceptance criteria

- Decide in the RFC 0149 prose where a Parameters' snake_case String keys become the camelCase option keys (at `full_url_for`'s `to_h.symbolize_keys` seat), and implement it there. Do not special-case it in ActionView.
- A test: `urlFor(new Parameters({ controller: "foo", action: "other" }))` from a view (RoutingUrlFor through the `action_view.setup_action_pack` wiring, as in `trailties/src/trailties/action-view.trails.test.ts`) generates a path, not a full URL.
