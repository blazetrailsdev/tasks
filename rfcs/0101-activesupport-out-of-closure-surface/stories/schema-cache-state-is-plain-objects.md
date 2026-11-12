---
title: "schema-cache-state-is-plain-objects"
status: closed
updated: 2026-11-12
rfc: "0101-activesupport-out-of-closure-surface"
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
closed-reason: "FALSIFIED: trails#10024 dropped the global plain-object load rule; SchemaCache loads Maps as on main."
---

## Context

`Marshal.load` (`packages/ruby-compat/lib/marshal.ts`, `TYPE_HASH` arm) now loads a
string-keyed, non-default, non-identity Hash as a plain object, per ruby-compat
README § "When a Ruby Hash is a `Hash` and when it is an object". `SchemaCache`
(`packages/activerecord/src/connection-adapters/schema-cache.ts`) still holds
`@columns`, `@primary_keys`, `@data_sources`, `@indexes` and `@columns_hash` as
`Map`s (~56 sites), although Rails keeps string-keyed Hashes
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:241-260,409-425`).
`marshalLoad` therefore converts each loaded object back with
`new Map(Object.entries(...))` behind an `instanceof Map` guard, which Rails'
`marshal_load` (`schema_cache.rb:416-425`) does not do.

## Acceptance criteria

- [ ] SchemaCache's table-keyed state is plain objects, read and written natively.
- [ ] `marshalLoad` assigns the loaded values directly, with no Map conversion.
- [ ] `initWith` / `encodeWith` stop carrying the "SchemaCache holds Hashes" lint disables.
- [ ] schema-cache tests stay green.
