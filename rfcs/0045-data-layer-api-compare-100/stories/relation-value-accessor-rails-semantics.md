---
title: "relation-value-accessor-rails-semantics"
status: ready
updated: 2026-06-29
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
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

PR #4051 (story ar-relation-surface) ported the readers AND, on review, the
public writers (get/set pairs calling `assertModifiableBang()` then assigning
the backing field) for every 1:1-field-backed value accessor, and switched the
readers to return the stored reference (not a copy) to match Rails'
`@values.fetch` semantics. Three items remain for full Rails fidelity:

1. **`joins_values=` writer.** trails splits `.joins` storage into
   `_namedInnerJoins` + `_joinValues`, so `joinsValues` is a computed concat
   with no single field to round-trip; a faithful writer needs the join storage
   unified (or a documented split-routing rule).
2. **Single-value nil-vs-false defaults.** `readonly_value` / `reordering_value`
   / `skip_query_cache_value` default to `nil` in Rails (only `create_with`
   defaults to `{}`); trails stores plain booleans initialized to `false`, so
   unset vs explicitly-false collapse. Needs tri-state fields
   (`boolean | undefined`) threaded through clone/merge/build paths.
3. **Pre-existing readers still copy.** `select_values` / `order_values` /
   `group_values` (ported before this story) still return copies; converge them
   to stored-reference semantics for consistency with the rest.

## Acceptance criteria

- Unify (or document split-routing for) join storage so `joinsValues=` writes
  faithfully; relation.rb / relation/query_methods.rb stay at 100% api:compare.
- Converge single-value defaults to Rails' nil-vs-false (tri-state fields).
- Converge `selectValues`/`orderValues`/`groupValues` readers to stored-ref
  semantics (or document a uniform defensive-copy rationale for ALL accessors).
- No test:compare regression.
