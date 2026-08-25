---
title: "call-args-ar-time-zone-converter-subtype-map"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6485
claim: "2026-08-13T18:35:39Z"
assignee: "call-args-ar-time-zone-converter-subtype-map"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-dropped-argument` (RFC 0099).
`TimeZoneConverter#convert_time_to_time_zone`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:40-50`)
ends in `map(value) { |v| convert_time_to_time_zone(v) }`, and `cast` (:31)
ends in `map(super) { |v| cast(v) }`. `TimeZoneConverter` is a
`DelegateClass(Type::Value)`, so `map` is the SUBTYPE's hook — the only
definition in the tree is `PostgreSQL::OID::Range#map`
(`connection_adapters/postgresql/oid/range.rb:50-54`), which rebuilds a Range
from the mapped ends.

trails' `packages/activerecord/src/attribute-methods/time-zone-conversion.ts:237`
instead does `Array.isArray(value) && value.map(...)` inline, so a range type
never gets to rebuild its own value and the `value` argument has no receiver
to be passed to. This is the reason on the RFC 0095 baseline row
(`attribute-methods/time-zone-conversion.ts` `convert_time_to_time_zone` →
`map`, Rails `(ref:value)` vs trails `()`).

## Acceptance criteria

1. Port the `map(value, &block)` hook onto the type layer: a default on
   `Type::Value` and the Range override mirroring `oid/range.rb:50-54`.
2. `convertTimeToTimeZone` and `TimeZoneConverter#cast` call the subtype's
   `map` rather than `Array#map`, matching Rails' argument list.
3. The `attribute-methods/time-zone-conversion.ts` `convert_time_to_time_zone`
   → `map` `kind: "args"` baseline row is deleted (only-shrink; no `--write`).
4. `pnpm parity:api:calls:args` stays green.
