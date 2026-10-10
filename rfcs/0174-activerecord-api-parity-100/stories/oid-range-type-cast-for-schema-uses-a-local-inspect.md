---
title: "OID::Range#type_cast_for_schema uses a hand-written inspect instead of rbInspect"
status: in-progress
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8751
claim: "2026-10-10T11:39:39Z"
assignee: "compatibility-module-members-unmeasured-by-parity-api"
blocked-by: null
closed-reason: null
---

## Context

`OID::Range#type_cast_for_schema`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/range.rb:16-18`) is
`value.inspect.gsub("Infinity", "::Float::INFINITY")`.

`packages/activerecord/src/connection-adapters/postgresql/oid/range.ts` calls a module-local `inspect(value)` instead: a
hand-written chain of `instanceof` arms over `null`, strings, `TimeWithZone`, `Time` and four Temporal types, falling
back to `String(value)`. It is an invented helper with its own arms, and it disagrees with ruby-compat's `rbInspect`
for anything not listed (a `Range`, an `Array`, a JS `Date`, which trails#8607 stopped rejecting there and which now
renders through `String(value)`).

## Acceptance criteria

- [ ] `typeCastForSchema` is `rbInspect(value).replace(/Infinity/g, "::Float::INFINITY")` and the local `inspect` is deleted.
- [ ] `postgresql/oid/range.trails.test.ts` expectations follow `rbInspect`'s output.
