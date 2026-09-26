---
title: "OID::Array#typeCastForSchema uses an invented JSON fallback instead of subtype.type_cast_for_schema"
status: in-progress
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8130
claim: "2026-09-26T02:17:05Z"
assignee: "mapper-drops-its-own-routes-buffer"
blocked-by: null
closed-reason: null
---

## Context

`OID::Array#type_cast_for_schema` (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb:62-65`) is:

```ruby
return super unless value.is_a?(::Array)
"[" + value.map { |v| subtype.type_cast_for_schema(v) }.join(", ") + "]"
```

trails (`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`) routes each element through an invented private `formatValueForSchema`. It treats `subtype.typeCastForSchema` as optional (`ArraySubtype.typeCastForSchema?`) and falls back to `JSON.stringify` / `String(value)` for bigint and for a subtype without the method. Rails calls `subtype.type_cast_for_schema(v)` unconditionally. `Array#join` also `to_s`es each result, and recursively flattens an Array result (a `point[]` column, since trails#8104 made `OID::Point#typeCastForSchema` return `[x, y]`).

## Acceptance criteria

- `typeCastForSchema` calls `this.subtype.typeCastForSchema(v)` unconditionally, and `formatValueForSchema` with its JSON fallback is deleted. The subtype contract requires `typeCastForSchema`.
- The join follows Ruby's `Array#join` (`to_s` per element, recursing into Array results), and a `point[]` default dumps as Rails would.
- The PG array schema-dumper tests stay green.
