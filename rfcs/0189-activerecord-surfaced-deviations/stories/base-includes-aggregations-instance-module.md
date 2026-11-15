---
title: "base-includes-aggregations-instance-module"
status: draft
updated: 2026-11-15
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

# Include Aggregations' instance module onto Base and inline its init_internals

## Context

Rails `ActiveRecord::Base` includes `Aggregations` (`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb`), whose
`init_internals` (`vendor/rails/v8.0.2/activerecord/lib/active_record/aggregations.rb:21-24`) calls `super` then sets
`@aggregation_cache = {}`; `initialize_dup` and `reload` (same file) also clear it.

In trails `packages/activerecord/lib/aggregations.ts` defines `initInternals`, `initializeDup`, `reload` and
`clearAggregationCache` on the `Aggregations` module, but `packages/activerecord/lib/base.ts` only
`extend(Base, _AggregationsClassMethods)`; the instance module is never included, and `Base#initInternals`
(the inlined `init_internals` chain, opted out under `shadowsIncluded`, trails#10140) has no
`Aggregations#init_internals` segment. `_aggregationCache` is never initialized on a record.

## Acceptance criteria

- [ ] `Base#initInternals` inlines `Aggregations#init_internals` at its Rails ancestry position, with an `@inlinedFrom` tag.
- [ ] Aggregations' `initializeDup` / `reload` / `clearAggregationCache` reach `Base` records as Rails' do.
- [ ] `displacedIncludedMembers(Base)` stays empty.
