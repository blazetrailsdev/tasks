---
title: "Relation#create/#create! should route through scoping and current_scope_restoring_block"
status: closed
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone: the scoping rows are no longer baselined. origin/main relation.json has no 'create -> current_scope_restoring_block', no 'create -> scoping', and no create! rows at all. The single surviving row 'create -> relation_class_for' now carries a reviewed per-site verdict: it is a homonym — relation_class_for is called by Relation::ClassMethods.create (delegation.rb:139-141), while relation.ts's create ports Relation#create (relation.rb:154-161), which makes no such call. No convergence available."
---

# `Relation#create` / `#create!` should go through `scoping` and `current_scope_restoring_block`

## Context

Surfaced finishing `wave-1b-relation-own-file-rows-remainder` (PR #6563).

Rows still baselined in `activerecord/relation.json` (`kind: "set"`):

    create  -> current_scope_restoring_block, relation_class_for, scoping
    create! -> current_scope_restoring_block, scoping

Rails, `activerecord/lib/active_record/relation.rb:154-176`:

    def create(attributes = nil, &block)
      if attributes.is_a?(Array)
        attributes.collect { |attr| create(attr, &block) }
      else
        block = current_scope_restoring_block(&block)
        scoping { _create(attributes, &block) }
      end
    end

    def create!(attributes = nil, &block)
      if attributes.is_a?(Array)
        attributes.collect { |attr| create!(attr, &block) }
      else
        block = current_scope_restoring_block(&block)
        scoping { _create!(attributes, &block) }
      end
    end

`current_scope_restoring_block` is relation.rb:1345.

trails' `create` / `createBang` (`packages/activerecord/src/relation.ts`)
call `this.build(attrs, block)` and then `save()` / `saveBang()`. `build`
inlines the scope save/restore by hand around `new this._model(attrs)`
(setting and restoring `currentScope` directly) rather than going through
`scoping`, and re-implements the "block runs after current_scope is
restored" semantics in a comment rather than through
`currentScopeRestoringBlock` — which already exists as a private method on
`Relation` and is unused on this path.

## Converged shape

`create`/`create!` build the restoring block via
`currentScopeRestoringBlock(block)` and wrap the construction in
`scoping(...)`, exactly as relation.rb:154-176 does. `build`'s hand-rolled
`ScopeRegistry.currentScope` save/restore goes away in favour of `scoping`.

Watch the async seam: trails' `scoping` is async while `build` is sync, so
this may need `_create`/`_createBang` to be the awaited half rather than
`build`. Do not add an abstraction Rails lacks to bridge it.

## Acceptance criteria

- [ ] `create` and `create!` call `currentScopeRestoringBlock` and `scoping`
      where Rails does; `create` also calls `relationClassFor`.
- [ ] Rows deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; all three adapter lanes green.
