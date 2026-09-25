---
title: "OID::Point#type_cast_for_schema returns [x, y]; credit ActiveRecord::Point members"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-25T19:40:38Z"
assignee: "eager-load-namespaces-without-eager-load-bang"
blocked-by: null
closed-reason: null
---

## Context

`OID::Point#type_cast_for_schema`
(`activerecord/lib/active_record/connection_adapters/postgresql/oid/point.rb:50-56`)
returns the Array `[value.x, value.y]` for an `ActiveRecord::Point`, which the
schema dumper then `inspect`s. trails
(`packages/activerecord/src/connection-adapters/postgresql/oid/point.ts`,
`typeCastForSchema`) returns the string `` `[${value.x}, ${value.y}]` `` instead,
bypassing the dumper's inspect of the Array (so float formatting such as `12.2`
vs `12.0` → `12` is not Ruby's `Float#inspect`).

Separately, `ActiveRecord::Point`'s Struct members `x`, `x=`, `y`, `y=`
(`point.rb:4`) are reported missing by `parity:api`: trails#8033 seats the struct
as a class expression `ActiveRecord.Point = class Point {...}`, which the TS
extractor does not see (the file already exports `OID::Point` as `Point`).

## Acceptance criteria

- `typeCastForSchema` returns `[value.x, value.y]`; the PG schema-dumper default
  for a point column matches Rails' `default: [12.2, 13.3]` (geometric_test.rb).
- `parity:api` credits `ActiveRecord::Point#x/x=/y/y=` (extractor support for a
  namespace-seated class expression, or an equivalent visible declaration), with
  no new extra surface.
