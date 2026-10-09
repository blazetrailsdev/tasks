---
title: "activerecord: _isActiveRecordBase marker reads compare against ActiveRecord::Base, and the marker is deleted"
status: in-progress
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8708
claim: "2026-10-09T13:39:39Z"
assignee: "collection-proxy-each-synchrony-is-decided-in-three-places"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Translation#lookup_ancestors` (trails#8705), which replaced
`Object.prototype.hasOwnProperty.call(klass, "_isActiveRecordBase")` with `klass === ActiveRecord.Base`
(the namespace seat, CLAUDE.md § "Call-time constant resolution"). `Base` still declares the marker
(`packages/activerecord/src/base.ts`, `static readonly _isActiveRecordBase = true`) and these sites still
read it where Rails writes `== Base`:

- `packages/activerecord/src/connection-handling.ts:25-27` — a module-local `isBaseClass(klass)` helper that
  is NOT `base_class?`; it answers `self == Base`. Used at `:36` and `:82` for
  `unless self == Base || abstract_class?`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:82`). The helper has no Rails
  counterpart and its name collides with `Inheritance::ClassMethods#base_class?`.
- `packages/activerecord/src/model-schema.ts:264` — `self.table_name = if self == Base`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:291`); the same body reads
  `Object.getPrototypeOf(klass)` at `:261` where Rails writes `superclass`.
- `packages/activerecord/src/attribute-methods.ts:453` — `if superclass == Base`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:170`).
- `packages/activerecord/src/attribute-methods.ts:471-477` and `packages/activerecord/src/associations.ts:95-101`
  — two copies of an invented `frameworkBase` prototype walk that finds the class owning the marker.
- `packages/activerecord/src/relation.ts:580,600,1447` — duck-typed `args._isActiveRecordBase === true`
  reads; read each Rails body before choosing the converged test.

Already converged, for the shape to follow: `core.ts:207,210` (`core.rb:376`),
`attribute-methods.ts:384` (`attribute_methods.rb:128`), `inheritance.ts:89`, `translation.ts`.

## Acceptance criteria

- [ ] Every site above compares against `ActiveRecord.Base` (`=== ActiveRecord.Base`), and steps with `rbClassSuperclass` where Rails writes `superclass`.
- [ ] `connection-handling.ts`'s local `isBaseClass` helper is deleted; its two callers inline `this === ActiveRecord.Base || this.abstractClass` in Rails' order.
- [ ] Both `frameworkBase` helpers are deleted, or reduced to what the Rails body at each call site actually does.
- [ ] `static readonly _isActiveRecordBase` is removed from `base.ts` once nothing reads it (grep `packages/*/src` including tests and `trailties`).
- [ ] `pnpm parity:api:calls`, `:calls:args` and `:extra:gate` green; plain-node import of the built `dist/` entry modules still loads (no new TDZ from the `namespaces.js` read).
