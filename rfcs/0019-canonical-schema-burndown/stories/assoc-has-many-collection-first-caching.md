---
title: "assoc-has-many-collection-first-caching"
status: ready
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `CollectionProxy#first` caches the loaded target after the first DB query. Calling
`collection.first` twice returns the SAME object reference (Ruby `assert_same`). After
`collection.reset`, the cache is cleared and the next `first` fetches a fresh object.

In trails `packages/activerecord/src/associations/collection-proxy.ts:683-690`, `toArray()`
deliberately does NOT set `_targetLoaded` or cache `_target` (see comment at line 686):

> "We deliberately do NOT yet hydrate/cache `_target` or mark the association loaded..."

When `first()` is called and `!_targetLoaded`, it delegates to `toArray()` which re-queries
the DB each time without caching. Two calls to `first()` return different objects.

Rails source:

- `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:903`
  `test_find_first_after_reset`

Skipped in `packages/activerecord/src/associations/has-many-associations.test.ts`
("find first after reset").

## Acceptance criteria

- [ ] `CollectionProxy#first` caches the loaded target (sets `_targetLoaded`) on first load,
      consistent with Rails' `load_target` behavior
- [ ] The two known gaps at collection-proxy.ts:686-692 (bang mutations + `_deleteThrough`)
      are resolved so `toArray()` can also hydrate the cache
- [ ] Test `"find first after reset"` un-skipped and passing
- [ ] No regressions in existing `toArray()` / `whereBang` tests
