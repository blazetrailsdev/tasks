---
title: "UrlForOptions is object; type it as full_url_for's arms"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

`UrlForOptions` (`packages/actionpack/src/action-dispatch/routing/url-for.ts:61`) is
`null | undefined | string | object`, so `urlFor` / `fullUrlFor` accept any object and check no
key. Rails' `full_url_for` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:182-202`)
dispatches on seven arms: `nil`, `Hash` / `ActionController::Parameters` (`:use_route` plus the
url options, with unknown keys becoming path segments / query params), `String`, `Symbol`
(named-route call), `Array` (polymorphic components + trailing options hash), `Class`, and a model
(`handle_model_call`).

PR #8305 typed `redirect_to`'s `url_for` Hash arm as `UrlOptions & Record<string, unknown>`
(`action-controller/metal/redirecting.ts`, `RedirectToOptions`) because `UrlForOptions` was looser
than that. `UrlOptions` (`action-dispatch/http/url.ts:11`) holds the known keys.

## Acceptance criteria

- `UrlForOptions` is a union mirroring `full_url_for`'s arms: `null | undefined`,
  `UrlOptions & { useRoute?: string } & Record<string, unknown>` (and `Parameters`), `string`,
  a Symbol-name string arm as the port spells it, an Array arm, a class, and `ToModel`.
- A wrongly-typed known option (`onlyPath: "yes"`) is a compile error at `urlFor`, with a
  `@ts-expect-error` check in a `.trails.test.ts`.
- `RedirectToOptions` reuses `UrlForOptions`'s Hash arm instead of spelling
  `UrlOptions & Record<string, unknown>` itself.
