---
title: "Base.setCurrentScope / setGlobalCurrentScope writers (scoping.rb:29-39)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6381
claim: "2026-08-11T22:06:06Z"
assignee: "converge-association-initialize-attributes-inline"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6377 while converging `Base.currentScope` to a method.

`activerecord/lib/active_record/scoping.rb:29-31` declares the WRITER
`current_scope=(scope)`, delegating to
`ScopeRegistry.set_current_scope(self, scope)`, and
`relation.rb:1346-1347` writes through it:

```ruby
def current_scope_restoring_block(&block)
  current_scope = model.current_scope(true)
  -> record do
    model.current_scope = current_scope
    yield record if block_given?
  end
end
```

The READER converged in #6377 (`Base.currentScope(skipInheritedScope = false)`),
but there is no writer on `Base`: `relation.ts#currentScopeRestoringBlock` and
every other write site (`relation.ts` `_scoping` / `scoping`,
`scoping/default.ts`, `relation/delegation.ts`) reach
`ScopeRegistry.setCurrentScope(modelClass, …)` directly, inlining the hop
`scoping.rb:30` makes. `global_current_scope=` (`scoping.rb:37-39`) has the
same shape.

Per CLAUDE.md a Ruby `x=` that cannot be a TS `set` accessor keeps the Rails
name as `setX()`.

## Acceptance criteria

1. `Base.setCurrentScope(scope)` and `Base.setGlobalCurrentScope(scope)` exist,
   delegating to `ScopeRegistry` exactly as `scoping.rb:29-39` does.
2. Every write site calls the model-level writer rather than `ScopeRegistry`
   directly; `currentScopeRestoringBlock` matches `relation.rb:1346-1348`.
3. `ScopeRegistry`'s parameter is `skipInheritedScope`, not `skipInherited`
   (`scoping.rb:26`, `scope_registry.rb`) — free fidelity while in the file.
4. `pnpm parity:api` / `pnpm parity:api:extra` non-negative;
   `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
