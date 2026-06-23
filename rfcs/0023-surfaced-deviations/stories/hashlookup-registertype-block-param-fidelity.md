---
title: "HashLookupTypeMap.registerType: route factory through block param, not value positional (Rails fidelity)"
status: ready
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`HashLookupTypeMap.registerType` (`packages/activerecord/src/type/hash-lookup-type-map.ts:83`)
accepts a function as its `value` positional arg:

```ts
registerType(key: string | number, value?: Type | ((lookupKey, ...args) => Type)): void {
  if (value == null) throw new ArgumentError(...);
  if (typeof value === "function") { this._mapping.set(key, value); }
  else { this._mapping.set(key, () => value); }
  ...
}
```

Vendored Rails (`vendor/rails/activerecord/lib/active_record/type/hash_lookup_type_map.rb:23`)
is `register_type(key, value = nil, &block)` — `value` is only ever a `Type`;
procs/blocks always arrive via `&block`. trails widens the public signature past
Rails by overloading `value` to also be a factory function. (Base `TypeMap` and
the seeders route factories through the dedicated block param, matching Rails.)

Surfaced during review of PR #4023 (pg-typemap-init-param-type-hole). Pre-existing
on main; not introduced by that PR, so left out of its single-file scope.

See memory: TypeMap/HashLookupTypeMap are standalone siblings in vendored Rails.

## Acceptance criteria

- [ ] `HashLookupTypeMap.registerType` mirrors Rails `register_type(key, value = nil, &block)`:
      `value` accepts only a `Type`; factories route through a separate block param.
- [ ] All callers (`type-map-init.ts` seeders, `aliasType`, tests) updated to the
      block form; no behavior change.
- [ ] PG type-map tests stay green; tsc clean; api:compare/test:compare non-negative.
