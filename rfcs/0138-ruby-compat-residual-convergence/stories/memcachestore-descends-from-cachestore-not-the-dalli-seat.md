---
title: "MemCacheStore descends from CacheStore, so its three includes cannot splice as Rails' do"
status: draft
updated: 2026-09-07
rfc: "0138-ruby-compat-residual-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Session::MemCacheStore < Rack::Session::Dalli`
(`actionpack/lib/action_dispatch/middleware/session/mem_cache_store.rb:23`),
a class that does NOT descend from `ActionDispatch::Session::AbstractStore`.
That is why its three `include`s — `Compatibility`, `StaleSessionCheck`,
`SessionObject` (`mem_cache_store.rb:24-26`) — are genuine first includes there,
splicing those modules into an ancestry that lacks them.

trails has `class MemCacheStore extends CacheStore`
(`packages/actionpack/src/action-dispatch/middleware/session/mem-cache-store.ts:11`)
and `CacheStore` descends from `AbstractStore`, which already includes the same
three (`abstract-store.ts:101-103`). PR #7584 converged `include()` onto Ruby's
`include_modules_at` skip (`vendor/ruby/class.c:1281,1291,1296`), so those three
calls are now no-ops — correct for the ancestry trails has, but the ancestry is
the deviation. It surfaced as a red `Action Pack Tests` lane on #7584, whose
assertion had pinned the pre-skip copy-down.

The behaviour is currently identical (same module bodies, same lookup result),
so this is a structural divergence rather than a live bug — but it means the
`include`s in `mem-cache-store.ts` are dead code that read as live, and any
future divergence between `Rack::Session::Dalli`'s ancestry and
`AbstractStore`'s would land silently.

## Converged shape

`MemCacheStore` descends from the trails counterpart of `Rack::Session::Dalli`
rather than from `CacheStore`, so its three `include`s splice as Ruby's do — or,
if no Dalli seat exists to descend from, the dead `include`s are removed and the
divergence recorded at the class rather than left implicit.

## Acceptance criteria

- `MemCacheStore`'s superclass, and the effect of its three `include` calls,
  match `mem_cache_store.rb:23-26`; or the calls that cannot splice are gone.
- `mem-cache-store.test.ts`'s mixin assertion states whichever guarantee the
  converged ancestry actually gives, with its test name untouched.
- The Action Pack lane stays green.
