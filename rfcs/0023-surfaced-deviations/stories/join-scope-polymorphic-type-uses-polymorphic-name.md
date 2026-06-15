---
title: "join_scope polymorphic type predicate should use foreign_klass.polymorphic_name not .name"
status: claimed
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-15T14:59:08Z"
assignee: "join-scope-polymorphic-type-uses-polymorphic-name"
blocked-by: null
---

## Context

Rails' `Reflection#join_scope`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:200-206`) builds the
polymorphic type predicate from `foreign_klass.polymorphic_name`:

```ruby
def join_scope(table, foreign_table, foreign_klass)
  ...
  if type
    klass_scope.where!(type => foreign_klass.polymorphic_name)
  end
```

`polymorphic_name` (`reflection.rb:725`) returns `active_record.polymorphic_name`
— i.e. the **base class** name, so STI subclasses store the base name in the
`*_type` column.

trails' `joinScope` (`packages/activerecord/src/reflection.ts:262`) instead uses
`foreignKlass.name`:

```ts
scope = scope.where({ [typeCol]: foreignKlass.name }); // reflection.ts:267
```

`foreignKlass.name` is the concrete class name, so for an STI subclass on the
polymorphic side the emitted type predicate is wrong (`type = "SubFoo"` instead
of `type = "Foo"`). The sibling read/preload path (`association-scope.ts:237`,
`:429`) already routes through the imported `polymorphicName(...)` helper from
`inheritance.ts`; only the `join_scope` (JoinDependency join) path was missed.

## Acceptance criteria

- [ ] `reflection.ts:267` builds the polymorphic type predicate from
      `polymorphicName(foreignKlass)` (the `inheritance.ts` helper already used
      by `association-scope.ts`), matching Rails
      `foreign_klass.polymorphic_name` (`reflection.rb:206`).
- [ ] An eager-load / joins test over a polymorphic association whose owner is
      an STI subclass emits `type = <base_class polymorphic_name>`; read the
      corresponding Rails `reflection`/`associations` test and mirror its name
      verbatim.
- [ ] api:compare / test:compare delta non-negative.
