---
title: "activerecord: retire SKIP_GROUPS' class_attribute storage-slot entry (_reflections, _counter_cache_columns, _attr_readonly, …)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: skips
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[10]` skips twelve underscore `class_attribute` names (`_reflections`, `_counter_cache_columns`,
`_attr_readonly`, `_destroy_association_async_job`, each with `=` and `?`) because trails stores them as
hand-rolled static fields that a same-named reader would clobber. CLAUDE.md § "Module mixins" now
settles `class_attribute` as `classAttribute()` from `@blazetrails/activesupport` — reads walk the
constructor chain, writes are local — which is exactly Rails' semantics and needs no separate field.
The `inlined-from` report also lists `base.ts _attrReadonly`, `_counterCacheColumns` as bodies living
on `Base` instead of `readonly_attributes.rb` / `counter_cache.rb`'s files.

Definitions: `vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb` (`class_attribute :_reflections`), counter_cache.rb,
readonly_attributes.rb, core.rb (`_destroy_association_async_job`).

## Acceptance criteria

- [ ] Each is declared through `classAttribute()` in the file mirroring its `.rb`, with Rails' default and `instance_writer`/`instance_predicate` options.
- [ ] `SKIP_GROUPS[10]` is deleted; the 12 names are scored and matched.
- [ ] Every reader of the old static fields goes through the class attribute; STI subclass isolation tests green.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
