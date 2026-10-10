---
title: "activerecord: CollectionAssociation#find_by_scan scans load_target, not the in-memory target"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

Surfaced while converging `activerecord-converge-missing-control-flow-arms-associations` (trails#8353).

`CollectionAssociation#find_by_scan`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb:521-531`)
scans the LOADED target:

```ruby
if ids.size == 1
  id = ids.first
  record = load_target.detect { |r| id == r.id.to_s }
  expects_array ? [ record ] : record
else
  load_target.select { |r| ids.include?(r.id.to_s) }
end
```

`packages/activerecord/src/associations/collection-association.ts` `findByScan` reads `this.target`
in both arms and never calls `loadTarget`, so on an unloaded association it scans whatever is in
memory instead of the loaded collection. Its one caller (`find`, the `inverse_of` arm,
`collection_association.rb:96-109`) does not load first in Rails either; the load is `find_by_scan`'s.
The port also returns from the `if` arm and falls through for the `else` arm rather than keeping
Rails' `if`/`else`.

`load_target` is async in trails, so `findByScan` becomes async and its caller awaits it.

## Acceptance criteria

- [ ] `findByScan` calls `loadTarget()` in each arm, as `collection_association.rb:526,529` do, and keeps the `if`/`else` shape.
- [ ] A test on an unloaded `inverse_of` collection shows `find(id)` scanning the loaded target.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new row.
