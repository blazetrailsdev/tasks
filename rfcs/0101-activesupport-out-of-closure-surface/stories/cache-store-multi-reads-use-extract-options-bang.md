---
title: "cache-store-multi-reads-use-extract-options-bang"
status: draft
updated: 2026-09-26
rfc: "0101-activesupport-out-of-closure-surface"
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

`Cache::Store#read_multi` / `#fetch_multi`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:536-620`) start
with `options = names.extract_options!`. That pops the last name only when it is
an extractable Hash (`Hash#extractable_options?`, `instance_of?(Hash)`).

trails' `Store` (`packages/activesupport/src/cache/store.ts:58`) uses a
module-private `extractOptions` that pops any non-Array object. So a name that
is an object, such as a record with `cacheKey()`, is taken as the options hash.
That object key is exactly what Rails'
`test_fetch_multi_with_objects` (`activesupport/test/cache/behaviors/cache_store_behavior.rb:216-228`)
exercises, and it is unported.

`extractOptionsBang` (`packages/activesupport/src/hash-utils.ts:138`) is the
existing port of `extract_options!`. Closed PR #8144's first revision converged
onto it and ported the test (a `CacheStruct` with a `cacheKey()` method and
`title`, asserting the Map `{ foo => "FOO!", bar => "BAM!" }`).

## Acceptance criteria

- [ ] `Store#readMulti` / `#fetchMulti` call `extractOptionsBang`; the local
      `extractOptions` is deleted.
- [ ] `fetch multi with objects` is ported into `cache-store-behavior.ts` and
      passes on MemoryStore and FileStore.
