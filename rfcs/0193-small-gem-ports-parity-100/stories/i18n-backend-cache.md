---
title: "i18n-backend-cache"
status: blocked
updated: 2026-10-17
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-10-17T22:02:38Z"
assignee: "distance-of-time-in-words-drops-invented-defaults"
blocked-by: "I18n.translate is synchronous but every ActiveSupport::Cache store's read/write is async (packages/activesupport/src/cache/store.ts:250,352), so Backend::Cache#_fetch (i18n backend/cache.rb) cannot read the store in-line; needs an owner decision on a sync cache seam"
closed-reason: null
---

## Context

`I18n::Backend::Cache` (`vendor/i18n/v1.14.8/lib/i18n/backend/cache.rb`) and `I18n.cache_store` / `cache_namespace` / `cache_key_digest` / `perform_caching?` (`cache.rb:44-74`) are unported in `@blazetrails/i18n` (no `packages/i18n/src/backend/cache.ts`). `test_translate_caching_backend` (`vendor/rails/v8.0.2/actionview/test/template/translation_helper_test.rb:392-410`) needs it, and is parked as `it.skip("translate caching backend")` at `packages/actionview/src/template/translation-helper.test.ts:481`.

This was blocked because `I18n.translate` is synchronous while every ActiveSupport::Cache store's `read` / `write` is async (`packages/activesupport/src/cache/store.ts:250,352`). Owner ruling 2026-10-20: use prewarm and peek, the pattern in `packages/activerecord/CLAUDE.md` § "Adapter facts are prewarmed and peeked".

## Design

`_fetch` (`cache.rb`) keeps its three statements in Rails' order:

```ruby
result = I18n.cache_store.read(cache_key)   # synchronous peek at a warm in-process copy
return result unless result.nil?
result = catch(:exception, &block)          # already synchronous: the backend lookup
I18n.cache_store.write(cache_key, result) unless result.is_a?(Proc)  # seat in the copy now; store write in the background
```

- **Prewarm.** Seating a store (`I18n.cache_store = store`) is followed by an awaited warm that loads the store's existing `i18n/<cache_namespace>/` entries into the in-process copy where the store can list keys (MemoryStore, FileStore, Redis). A store that can't list keys warms empty. Memcached is deferred work anyway.
- **Peek.** `read` in `_fetch` answers from the copy only. It never awaits.
- **Write.** A miss computes synchronously, seats the result in the copy, and starts the store `write` without awaiting it.
- The i18n gem does not depend on ActiveSupport (`cache.rb:13-16` only needs a store that answers `fetch` / `write`), and `@blazetrails/i18n` depends only on ruby-compat and date. Keep it that way: the copy and the warm live in i18n, and they talk to the store only through its public `read` / `write` and a key listing.
- **Accepted differences from Rails, recorded at the call site against the ratified section:** an entry written to the shared store by another process after the warm is not seen (it is recomputed, so this is a miss, not a wrong answer), and a failed store write does not raise to the `translate` caller.

## Acceptance criteria

- [ ] `packages/i18n/src/backend/cache.ts` ports `translate`, `fetch`, `_fetch`, `cache_key` and `digest_item` line for line, with the `I18n.cacheStore` / `cacheNamespace` / `cacheKeyDigest` / `isPerformCaching` accessors.
- [ ] The prewarm is an awaited step after `I18n.cacheStore` is set (the shape of `ConnectionAdapters.load`'s awaited step). No `translate` path awaits.
- [ ] `vendor/i18n/v1.14.8/test/backend/cache_test.rb` is ported and passes. An assertion that depends on an in-line store write being visible to a second process is dropped with a receipt.
- [ ] `translate caching backend` in `translation-helper.test.ts` is un-skipped and passes.
- [ ] A trails test shows that an entry already in the store before the warm is read with no backend lookup, and that a miss is visible in the store after the background write settles.
