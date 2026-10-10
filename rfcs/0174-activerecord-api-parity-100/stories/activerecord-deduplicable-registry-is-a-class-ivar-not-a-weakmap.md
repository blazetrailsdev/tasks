---
title: "activerecord: Deduplicable.registry is an own-property class ivar, not a module-level WeakMap"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::ConnectionAdapters::Deduplicable::ClassMethods#registry` is `@registry ||= {}` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:9-11`): an instance variable on the class it is called on, not inherited by a subclass.

`packages/activerecord/src/connection-adapters/deduplicable.ts` keeps the per-class `Hash` in a module-level `const registries = new WeakMap<object, Hash<object, object>>()`, and `registry` is `registries.get(this) ?? new Hash()` followed by an unconditional `registries.set`. The storage is a side table Rails does not have, and the body is not `||=`.

The repo's shape for a class-level ivar that a subclass must not inherit is an own-property memo (root CLAUDE.md, "`inherited` is deferred to own-property memo guards"): answer the memo only when it is an own property of the class being asked.

## Acceptance criteria

- [ ] `registry` reads and seats an own `_registry` property on the receiver class (`Object.prototype.hasOwnProperty.call(this, "_registry")`), so a subclass gets its own `Hash` as a Ruby class ivar does; the module-level `registries` WeakMap is deleted.
- [ ] `column-equality.trails.test.ts` and `column.trails.test.ts` stay green, and a subclass of a `Deduplicable` includer does not share its parent's registry.
- [ ] `pnpm parity:api:extra:gate` stays green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/connection-adapters/column-equality.trails.test.ts packages/activerecord/src/connection-adapters/column.trails.test.ts
```
