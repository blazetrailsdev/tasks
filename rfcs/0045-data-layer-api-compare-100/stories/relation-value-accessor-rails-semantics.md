---
title: "relation-value-accessor-rails-semantics"
status: ready
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails generates BOTH a reader and a writer for every `Relation::VALUE_METHODS`
entry (`relation/query_methods.rb:162-181`):

```ruby
def #{name}_values        ; @values.fetch(:#{name}, DEFAULT) ; end
def #{name}_values=(value) ; assert_modifiable! ; @values[:#{name}] = value ; end
```

PR #4051 (story ar-relation-surface) ported the **readers** as thin getters but
deviates from Rails in three ways the api:compare reviewer flagged:

1. **No public writers.** Rails exposes `includes_values=`, `readonly_value=`,
   `having_clause=`, `create_with_value=`, etc., and uses them internally
   (merger.rb, association_scope.rb, the bang methods). trails realizes those
   writes via bang methods + direct private-field assignment, so the public
   `*_values=`/`*_value=` surface is absent. trails already has
   `assertModifiable` / `ImmutableRelation`, so porting the setters is small.
2. **Readers copy instead of returning the stored entry.** trails getters
   return `[...field]` / `{...field}`; Rails returns the stored `@values` entry
   directly (`@values.fetch(:name, default)`), so Rails-observable in-place
   mutation of a stored array/hash is not mirrored.
3. **Single-value nil-vs-false defaults.** `readonly_value` / `reordering_value`
   / `skip_query_cache_value` default to `nil` in Rails (only `create_with`
   defaults to `{}`); trails stores plain booleans initialized to `false`, so
   unset vs explicitly-false collapse.

## Acceptance criteria

- Add public `*_values=` / `*_value=` setters on Relation mirroring Rails'
  generated writers (call `assertModifiable()`, then assign), and route the
  bang methods / merger / association_scope through them where Rails does.
- Decide and document reader return semantics: either return the stored
  reference (Rails-faithful) or keep defensive copies with a justification that
  applies uniformly to ALL value accessors (not just the new ones).
- Converge single-value defaults to Rails' nil-vs-false (tri-state fields, e.g.
  `boolean | undefined`) so an unset flag is distinguishable from `false`.
- relation.rb / relation/query_methods.rb stay at 100% api:compare; no
  test:compare regression.
