---
title: "Drop lastChainScope's extra klass parameter by resolving the polymorphic target reflection-side"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6562
claim: "2026-08-15T12:45:04Z"
assignee: "index-name-exists-returns-index"
blocked-by: null
closed-reason: null
---

# Drop `lastChainScope`'s extra `klass` parameter by resolving the polymorphic target reflection-side

## Context

Surfaced converging RFC 0099's `kind: "args"` rows in PR #6557. The row

    activerecord | associations/association-scope.ts | add_constraints | last_chain_scope
    rubyArgs: [scope, last, owner]

carries a reviewed reason rather than a fix.

`vendor/rails/activerecord/lib/active_record/associations/association_scope.rb:124-125`:

    def add_constraints(scope, owner, chain)
      scope = last_chain_scope(scope, chain.last, owner)

and `last_chain_scope(scope, reflection, owner)` (association_scope.rb:58-62)
reads its table straight off the reflection:

    table = reflection.aliased_table

trails passes a fourth argument — the runtime `klass`
(`packages/activerecord/src/associations/association-scope.ts:391-396`, called
at :696) — because for a polymorphic `belongs_to` the target class is not known
at definition time and `reflection.klass` throws. The block comment at :403-407
records this.

## Converged shape

`lastChainScope(scope, reflection, owner)` — three parameters, matching Rails.
The polymorphic target is resolved through the reflection (a `ReflectionProxy`
already carries `aliasedTable` for multi-step chains; the chain-length-1
polymorphic case needs the same treatment) rather than threaded from the caller.

## Acceptance criteria

- [ ] `lastChainScope` takes Rails' three parameters and `addConstraints` calls
      it with them.
- [ ] Polymorphic `belongs_to` scoping still resolves its target — the case the
      fourth argument exists for — with a test covering it.
- [ ] The `add_constraints -> last_chain_scope` row is deleted by hand from its
      shard (no `--write`, no reseed).
- [ ] `pnpm parity:api:calls:args` green; all three adapter lanes green.
