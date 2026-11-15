---
title: "RoutingUrlFor#ensureOnlyPathOption writes onlyPath where Rails writes the String only_path on a Parameters"
status: draft
updated: 2026-11-15
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `RoutingUrlFor#ensure_only_path_option`
(`vendor/rails/v8.0.2/actionview/lib/action_view/routing_url_for.rb:143-147`)
is `options.key?(:only_path)` / `options[:only_path] = ...`. When `options` is
an `ActionController::Parameters`, both calls convert the Symbol to the String
key `"only_path"`, so a Parameters ends up carrying `"only_path"`.

trails' `ensureOnlyPathOption` (`packages/actionview/lib/routing-url-for.ts:169-177`)
calls `hasKey(options, "onlyPath")` and `hashAset(options, "onlyPath", ...)`
on both arms. On a Parameters that:

- misses a caller's `only_path: false`, and
- writes a second key, `"onlyPath"`, beside it.

`fullUrlFor` (trails#10121) then gets both keys. Both cross to `onlyPath`
(`packages/actionpack/lib/action-dispatch/routing/url-for.ts`, Parameters arm),
and the injected `true` can win. So
`view.urlFor(new Parameters({ controller: "foo", action: "other", only_path: false }).permitBang())`
gives `/foo/other` where Rails gives `http://example.com/foo/other`.

## Acceptance criteria

- `ensureOnlyPathOption` reads and writes `"only_path"` on a Parameters, as
  Rails' Symbol→String conversion does, and keeps `onlyPath` on a Hash.
- A test in `packages/trailties/test/trailties/action-view.trails.test.ts` shows
  a view's `urlFor` of a permitted Parameters with `only_path: false` and a
  controller host generates the full URL.
