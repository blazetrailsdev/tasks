---
title: "activerecord: Relation#new holds the body and build is its alias, through scoping"
status: draft
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines `Relation#new` and aliases `build` to it
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:125-133`):

```ruby
def new(attributes = nil, &block)
  if attributes.is_a?(Array)
    attributes.collect { |attr| new(attr, &block) }
  else
    block = current_scope_restoring_block(&block)
    scoping { _new(attributes, &block) }
  end
end
alias build new
```

trails has it the other way round in `packages/activerecord/src/relation.ts`: `build` holds the
body and `new` is `Array.isArray(attrs) ? this.build(attrs, block) : this.build(attrs, block)`,
two identical arms. `build`'s body also does not call `scoping`: it reads
`ScopeRegistry.currentScope(modelClass)`, calls `modelClass.setCurrentScope(this)` and restores in
a hand-written `try` / `finally`, and it only wraps the block in `currentScopeRestoringBlock` when
one was passed, where Rails calls it unconditionally. The parameter is `attrs` on `new` and
`attributes` on `build`; Rails' is `attributes`, defaulting to `nil`, not `{}`.

Seen while working trails#8659, which made `Relation#_new` (`relation.rb:1353-1355`) the only
caller of the model constructor on this path.

## Acceptance criteria

- [ ] `Relation#new` in `relation.ts` is `relation.rb:125-132` line for line: the Array arm
      recursing through `new`, then `block = currentScopeRestoringBlock(block)` and
      `this.scoping(() => this._new(attributes, block))`.
- [ ] `build` is the alias of `new`, with no body of its own.
- [ ] The hand-written `setCurrentScope` / restore in the old `build` body is gone.
- [ ] `relation/scoping.test.ts`, `scoping/default-scoping.test.ts`, `scoping/named-scoping.test.ts`
      and `associations/has-many-associations.test.ts` green; `parity:api:calls` and `:calls:args`
      green with no new baseline row.
