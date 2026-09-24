---
title: "AssociationReflection#associationScopeCache keys on the reflection, not a name string"
status: done
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8039
claim: "2026-09-24T16:15:15Z"
assignee: "association-scope-cache-keys-on-reflection"
blocked-by: null
closed-reason: null
---

## Context

`Reflection#association_scope_cache` keys the statement cache on the reflection itself, suffixed with the owner's foreign type for a polymorphic reflection (`vendor/rails/activerecord/lib/active_record/reflection.rb:540-548`):

```ruby
key = self
if polymorphic?
  key = [key, owner._read_attribute(@foreign_type)]
end
```

trails' `AssociationReflection#associationScopeCache` (`packages/activerecord/src/reflection.ts`, around line 922) builds the string key `` `assocScope:${this.activeRecord.name}#${this.nameString}` `` plus `:<foreign type>`. So two distinct reflections that share an owner class name and association name share a cache entry. That happens with anonymous classes and with redefined models in tests. `cachedFindByStatement` (`core.ts`) keys its cache map by that string. trails#7985 converged the `klass.with_connection` wrapper and left the key alone.

## Acceptance criteria

- `associationScopeCache` passes the reflection itself as the key, or `[this, foreignTypeValue]` when it is polymorphic, as `reflection.rb:541-544` does.

- `cachedFindByStatement`'s cache (`core.ts`) accepts a non-string key, compared the way Ruby's Hash compares these keys (identity for the reflection, `eql?` for the array form).

- A test shows two reflections with the same owner name and association name get separate statement caches.
