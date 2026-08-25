---
title: "Drop the klass parameter from addConstraints / nextChainScope"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6567
claim: "2026-08-15T15:15:04Z"
assignee: "wave-3a-sqlite3-adapter"
blocked-by: null
closed-reason: null
---

# Drop the `klass` parameter from `addConstraints` / `nextChainScope`

## Context

Surfaced in review of PR #6562, which converged the sibling
`lastChainScope` signature (story
`drop-last-chain-scope-klass-parameter`).

Rails:

- `add_constraints(scope, owner, chain)` —
  `vendor/rails/activerecord/lib/active_record/associations/association_scope.rb:124`
- `next_chain_scope(scope, reflection, next_reflection)` —
  `association_scope.rb:82`

trails' `addConstraints`
(`packages/activerecord/src/associations/association-scope.ts:680`) and
`nextChainScope` (:545) each carry a fourth `klass?: typeof Base` parameter,
threaded from `AssociationScope.scope`. `lastChainScope` carried the same
parameter for the polymorphic `belongs_to` target and no longer needs it:
PR #6562 made `RuntimeReflection#aliasedTable` an attribute over
`klass.arelTable` and `#joinPrimaryKey` default its klass to the runtime one
(`reflection.rb:1271-1277`), so the chain head resolves its own target.

`nextChainScope` reads the runtime klass for the same two things — the table
name and the join keys — off `reflection` / `nextReflection`, both of which are
chain entries (`RuntimeReflection` or `ReflectionProxy`) that already carry
`aliasedTable` and `klass`. The parameter should therefore drop the same way.

## Acceptance criteria

- [ ] `addConstraints(scope, owner, chain)` and
      `nextChainScope(scope, reflection, nextReflection)` take Rails'
      parameters, and `AssociationScope.scope` calls them with them.
- [ ] The runtime klass is resolved through the chain entry (as
      `lastChainScope` now does), not threaded from the caller.
- [ ] Polymorphic and multi-step through chains still resolve their target —
      `association-scope.test.ts`'s polymorphic and through cases stay green.
- [ ] Any `kind: "args"` row that goes stale is deleted by hand from its shard
      (no `--write`, no reseed); `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
