---
title: "converge-cache-configured-onto-configmethods"
status: draft
updated: 2026-09-07
rfc: "0138-ruby-compat-residual-convergence"
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

`AbstractController::Caching::ConfigMethods` defines `cache_configured?` as a
private module method reading `perform_caching && cache_store` off `self`
(`vendor/rails/actionpack/lib/abstract_controller/caching.rb:23-25`). trails
has TWO bodies for that one Rails method, neither of them on `ConfigMethods`:

- `packages/actionpack/src/abstract-controller/caching.ts:33` —
  `export function cacheConfigured(host: CachingHost): boolean`, taking the
  host as a parameter instead of `this`, and re-exported from
  `abstract-controller/index.ts:47`.
- `packages/actionpack/src/abstract-controller/caching/fragments.ts:7` — a
  file-private duplicate of the same body, so `write_fragment` and friends do
  not have to import the other one.

Rails' callers are `Caching#cache` (`caching.rb:60`) and the four
`Fragments` bodies (`caching/fragments.rb:79,90,102,113`), all of which spell
it `cache_configured?` on `self` because the module is included into the same
class.

PR #7590 converged `ConfigMethods`' `cache_store` reader/writer onto
`ActiveSupport::Configurable`'s `config` and left this one alone as a
pre-existing deviation with its own blast radius.

## Converged shape

One body, on `ConfigMethods`, reached through `this` by both call sites, with
the `SKIP_GROUPS`/conventions-correct spelling of a Ruby `?` predicate settled
(the current `cacheConfigured` is neither `isCacheConfigured` nor private).
`fragments.ts`' duplicate is deleted and `abstract-controller/index.ts` stops
re-exporting a member Rails marks private.

## Acceptance criteria

- [ ] Exactly one TS body for `cache_configured?`, defined on `ConfigMethods`.
- [ ] `caching.ts`'s `cache` and the four `fragments.ts` bodies call it on
      `this`, as `caching.rb:60` and `caching/fragments.rb:79,90,102,113` do.
- [ ] It is not re-exported as public surface; `pnpm parity:api:extra
--package actionpack` reports no name for it.
