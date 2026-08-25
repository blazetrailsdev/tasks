---
title: "Mass assignment stops returning a promise for nested attributes"
status: done
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6196
claim: "2026-08-07T20:00:40Z"
assignee: "fold-errors-map-default-proxies"
blocked-by: null
closed-reason: null
---

## Context

Introduced by PR #6167 and justified at the call site, but a deviation worth a
convergence story. Rails' mass assignment returns nil and does its work inline:

```ruby
# vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:32-35
def assign_attributes(new_attributes)
  ...
  _assign_attributes(sanitize_for_mass_assignment(new_attributes))
end
# vendor/rails/activerecord/lib/active_record/attribute_assignment.rb:9-28
```

In trails a nested-attributes key that DISPLACES an existing record owes Rails'
inline `load_target` / `remove_target!` (has_one_association.rb:59-69) a write,
which `assignAttributes` cannot await. `packages/activerecord/src/persistence.ts`
therefore returns `Promise<void> | void` from `assignAttributes`,
`assignNestedParameterAttributes` and `_assignAttribute`, chained sequentially
through the `assignAfter` helper so the steps still run one-at-a-time as Rails'
`each` does. A caller that ignores the return — `attributes=` (base.ts), and any
user code — silently drops that write.

`assignAfter` itself has no Rails counterpart: it is the sequencing shim a
synchronous `each` needs when one iteration can go async.

## Converged shape

Give mass assignment an awaitable surface (`await record.setAttributes({...})`,
the `set#{Name}` shape RFC 0087 settled on for every other writer), make it the
only path that accepts nested-attributes keys, and return the assignment to a
plain `void`. `assignAfter` disappears with the mixed sync/async return, and
`attributes=` stops being able to start a write nobody awaits.

Sibling of `retire-sync-association-mass-assignment-arms` (done), which handled
the has_one arm of the same problem; this is the nested-attributes arm.

## Acceptance criteria

- `assignAttributes` returns `void`; no mass-assignment entry point answers a
  promise.
- `assignAfter` is deleted.
- The ordering guard `finishes a displacing nested assignment before assigning
the next key` (`nested-attributes.trails.test.ts`) still holds on the awaitable
  surface.
