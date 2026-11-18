---
title: "Tell an async serialized coder apart without probing its load"
status: draft
updated: 2026-11-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10276's `_loadSerializedAttributes` (`packages/activerecord/lib/type/serialized.ts`) finds out whether a non-built-in coder's `load` answers a promise by calling it. It casts the first non-nil value through `attribute.typeCast` and records the result on the type as `Serialized#_coderLoadsAsync`. For a sync user coder that probe is one `load` call, made at record build and then discarded, which Rails never makes. Rails' `Type::Serialized#deserialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/serialized.rb:18-24`) runs `coder.load` only lazily, on first read. So a user coder's `load` side effects run once more per `Serialized` type than in Rails, on a record whose attribute may never be read.

## Acceptance criteria

- [ ] An async coder is told apart from a sync one without calling `load`, so a sync user coder's `load` runs only on first read, as `serialized.rb:18-24` does.
- [ ] `_coderLoadsAsync` and the discarded probe are removed.
- [ ] `serialized-attribute.trails.test.ts` "probes a sync user coder once per type and leaves later reads lazy" asserts zero loads before the first read on the first find, too.
