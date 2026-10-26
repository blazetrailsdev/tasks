---
title: "statement-cache-bind-map-drops-bare-substitute-arms"
status: draft
updated: 2026-10-26
rfc: "0189-activerecord-surfaced-deviations"
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

`StatementCache::BindMap` (`vendor/rails/v8.0.2/activerecord/lib/active_record/statement_cache.rb:114-129`)
records an index only where `ActiveModel::Attribute === attr && Substitute === attr.value`,
and `bind` is `bas[offset] = bas[offset].with_cast_value(values[i])` with no other arm.

trails' `BindMap` (`packages/activerecord/src/statement-cache.ts`, constructor and `bind`)
adds two arms: a bare `attr instanceof Substitute` index, and `bas[offset] = values[i]`
for a non-Attribute. They exist because trails' cacheable-query path hands `BindMap`
bare `Substitute`s where Rails' `cacheable_query` binds are `QueryAttribute`s
(`predicate_builder` builds `Relation::QueryAttribute` around the `Substitute`). Removing
just the two arms reds 35 tests in `core.test.ts` / `finder.test.ts` (tried in trails#9325).

## Acceptance criteria

- [ ] The binds `StatementCache.create` passes to `BindMap` are Attributes wrapping the
      `Substitute`, as Rails' predicate builder produces them.
- [ ] `BindMap`'s constructor and `bind` are Rails' bodies, with the two invented arms gone.
- [ ] `finder.test.ts`, `core.test.ts` and `statement-cache.test.ts` stay green.
