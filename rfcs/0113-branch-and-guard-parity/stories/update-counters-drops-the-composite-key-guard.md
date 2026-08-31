---
title: "update-counters-drops-the-composite-key-guard"
status: done
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: 7287
claim: "2026-08-31T09:54:12Z"
assignee: "locator-use-drops-the-no-locator-raise"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::CounterCache::ClassMethods#update_counters`
(`vendor/rails/activerecord/lib/active_record/counter_cache.rb:115-118`):

```ruby
def update_counters(id, counters)
  id = [id] if composite_primary_key? && id.is_a?(Array) && !id[0].is_a?(Array)
  unscoped.where!(primary_key => id).update_counters(counters)
end
```

`packages/activerecord/src/counter-cache.ts#updateCounters` drops the whole
first line — its skeleton is `ref:unscoped ref:where ref:buildPkPredicate
ref:updateCounters` against Rails' `if ref:composite_primary_key? if ref:is_a?
if ref:get ref:is_a? …`: three missing arms.

That line is what makes a single composite key (`[1, 2]`) mean ONE record
rather than two ids, so on a composite-PK model the port reads a single key as a
list of scalar ids. Rails also uses `where!` on the unscoped relation, not
`where`.

Surfaced by the RFC 0113 noise-floor audit (row 51 of the seed-113 sample,
`docs/infrastructure/arm-mismatch-noise-floor.md`), classified `real`.

## Converged shape

Port the guard line as Rails writes it, in the same position and with the same
three conditions, then `unscoped.where!(primaryKey => id)`.

## Acceptance criteria

- [ ] `updateCounters([1, 2], …)` on a composite-PK model updates the one record
      with that key; an array of keys still updates each.
- [ ] Tests use the canonical composite-PK models and are named after the Rails
      tests covering them.
- [ ] The row leaves `pnpm parity:api:arms:report`.
