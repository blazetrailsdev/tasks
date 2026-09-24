---
title: "Converge PointValue onto ActiveRecord::Point"
status: in-progress
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: 8
pr: trails#8033
claim: "2026-09-24T13:35:28Z"
assignee: "point-value-converges-onto-active-record-point"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`.
`connection-adapters/postgresql/oid/point.ts` exports `PointValue`, scored
`novel`. Rails defines the value as a separate Struct in the same file,
outside the OID namespace:

```ruby
module ActiveRecord
  Point = Struct.new(:x, :y)
```

(`activerecord/lib/active_record/connection_adapters/postgresql/oid/point.rb:4`),
and `OID::Point#cast` builds `ActiveRecord::Point.new(...)`. The TS name
collides with `OID::Point` in the same module, which is why it was renamed.

Related: `pg-legacy-point-attribute-type-resolution`,
`pg-point-mutation-dirty-after-reload`.

## Acceptance criteria

- The struct is reachable as `ActiveRecord.Point` (seated on the namespace in
  `namespaces.ts`, CLAUDE.md § "Call-time constant resolution") and
  `PointValue` is gone, or parity credits it against `ActiveRecord::Point`.
- `PointValue`'s receipts are removed.
