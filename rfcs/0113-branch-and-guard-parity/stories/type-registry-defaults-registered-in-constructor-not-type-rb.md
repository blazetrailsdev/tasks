---
title: "Type::Registry's constructor registers the default types Rails registers in type.rb, plus a :value entry Rails has not"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Type::Registry`'s klass arm and lookup varargs in
PR #7271 (RFC 0113). That PR converged `register` / `lookup`
(`activemodel/lib/active_model/type/registry.rb:15-30`) and moved the default
registrations to Rails' klass form, but left WHERE they happen diverged.

Rails' `Registry#initialize` does one thing (`registry.rb:6-8`):

```ruby
def initialize
  @registrations = {}
end
```

and the defaults are registered at module level in
`activemodel/lib/active_model/type.rb:43-53`, through `Type.register`:

```ruby
register(:big_integer, Type::BigInteger)
register(:binary, Type::Binary)
register(:boolean, Type::Boolean)
register(:date, Type::Date)
register(:datetime, Type::DateTime)
register(:decimal, Type::Decimal)
register(:float, Type::Float)
register(:immutable_string, Type::ImmutableString)
register(:integer, Type::Integer)
register(:string, Type::String)
register(:time, Type::Time)
```

`packages/activemodel/src/type/registry.ts:26-39` instead registers all of
them inside the `TypeRegistry` constructor. Two consequences:

1. **Wrong file and wrong seam.** The registration list belongs in
   `type.ts` (mirroring `type.rb`), not in `registry.ts`. Every
   `new TypeRegistry()` — including the ones Rails builds empty, e.g. in
   `registry_test.rb` — comes pre-populated in trails, so a test that means
   "an empty registry" gets twelve entries.
2. **An extra registration.** trails registers `"value"` →
   `ValueType`, which Rails' `type.rb` does NOT register at all. `Type.default_value`
   (`type.rb:56-58`) is how Rails reaches a bare `Value`, and it is already
   ported as `defaultValue()` in `type.ts`.

Rails' order is alphabetical by type name; trails' is not, which
`blazetrails/rails-file-structure-method-order` would notice if the list moved
to the file it belongs in.

## Converged shape

`TypeRegistry`'s constructor sets up an empty `registrationsMap` only. The
twelve `register(...)` calls move to `packages/activemodel/src/type.ts` at
module scope, in Rails' order, spelled through the exported `register()`
wrapper the way `type.rb:43-53` calls its own. Drop the `"value"`
registration; `defaultValue()` already covers that need.

Check `packages/activerecord/src/type.ts`, which registers its own five types
against the same shared `typeRegistry` and currently relies on the base
registrations existing by construction time.

## Acceptance criteria

- [ ] `new TypeRegistry()` yields an empty registry, as `registry.rb:6-8` does.
- [ ] The default registrations live in `type.ts`, in Rails' order, matching
      `type.rb:43-53`.
- [ ] No `"value"` registration; `defaultValue()` is the path to a bare `ValueType`.
- [ ] activemodel and activerecord type suites green; `pnpm parity:api:extra`
      for activemodel does not grow.
