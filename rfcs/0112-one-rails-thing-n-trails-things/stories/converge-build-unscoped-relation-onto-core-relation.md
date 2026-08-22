---
title: "Base._buildUnscopedRelation is a trails seat for Rails' relation()"
status: ready
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `Base._buildUnscopedRelation` is a trails seat for Rails' `relation()`

## Context

Rails' `Core::ClassMethods#relation`
(`activerecord/lib/active_record/core.rb:431-435`) is:

```ruby
def relation
  relation = Relation.create(self)
  if finder_needs_type_condition? && !ignore_default_scope?
    relation.where!(type_condition)
  else
    relation
  end
end
```

trails spells it `Base._buildUnscopedRelation(table?)`
(`packages/activerecord/src/base.ts:2189-2198`), an `@internal` static with no
Ruby counterpart: it constructs `new (_relationCtorFor(this))(this, table)`,
wraps it in the scope proxy, and layers the STI predicate through a second
trails-invented private, `_applyStiTypeCondition`.

PR #6840 ported `Delegation::ClassMethods#create`
(`activerecord/lib/active_record/relation/delegation.rb:139-141`) and retired
the sibling invention `_buildBareRelation` by routing
`AbstractReflection#build_scope` (`reflection.rb:336-338`) through it. The
construction half of `_buildUnscopedRelation` is now the same call, so the
remaining gap is the method's name and the STI arm.

## Converged shape

`relation()` on `Base`, at the Rails name, calling
`Relation.create(this, { table })` and applying `type_condition` under Rails'
own `finder_needs_type_condition? && !ignore_default_scope?` guard —
`_applyStiTypeCondition` folding into that arm rather than standing beside it.
The `table` argument has no Rails counterpart and should be checked against its
callers: Rails' `relation` takes none, and `build_scope` is now the seat that
passes a possibly-aliased table.

Retires two `api:extra` novel names on `Base` (`_buildUnscopedRelation`,
`_applyStiTypeCondition`) and scores `relation` for `core.rb`.

## Acceptance criteria

- [ ] `Base.relation()` exists at the Rails name with Rails' body and guard.
- [ ] `_buildUnscopedRelation` and `_applyStiTypeCondition` are gone, with every
      caller reading `relation()`.
- [ ] `parity:api:extra --package activerecord` loses two novel names and gains
      none; `parity:api:calls` green.
- [ ] STI, default-scope and association-scope suites pass on all three adapters.
