---
title: "activerecord: DisableJoinsAssociationScope#add_constraints is a method override, not a this-typed module function"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

`DisableJoinsAssociationScope#add_constraints(reflection, key, join_ids, owner, ordered)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:33`)
is a private instance method overriding `AssociationScope#add_constraints(scope, owner, chain)`
(`associations/association_scope.rb`). trails#8343 ported it as an exported `this`-typed MODULE FUNCTION
`addConstraints` in `packages/activerecord/src/associations/disable-joins-association-scope.ts:66`,
called as `addConstraints.call(this, …)` at `:35` and `:55`, with the base keeping
`private addConstraints(scope, owner, chain)` (`association-scope.ts:180`).

That clears the arity row (story `activerecord-disable-joins-association-scope-add-constraints-arity`,
closed against trails#8343) but is not the shape that story asked for, nor the one CLAUDE.md
§ "Override arity" ratifies: a method override, with the base taking `..._rest: unknown[]`.
trails#8343's PR body says TypeScript rejects the override because the two parameter lists are unrelated
types (`Relation` vs `ChainEntry` in position 1 → TS2416), which § "Override arity" does not cover
(its example shares the first parameter's type). Nobody has re-tested that claim, and the deviation
carries no receipt at the declaration and no ratification.

## Acceptance criteria

- [ ] Try the converged shape: `addConstraints` as a `protected`/`private`-by-`@internal` method on `DisableJoinsAssociationScope` with Rails' five parameters, base `AssociationScope#addConstraints(scope, owner, chain, ..._rest: unknown[])`, call sites `this.addConstraints(…)`.
- [ ] If TS2416 on unrelated positional types genuinely blocks it, record the attempt and take it to the repo owner for a § "Override arity" ruling; until ruled, the module function carries the matching receipt at its declaration. Do not close by justification alone.
- [ ] `pnpm parity:api` arity for `associations/disable_joins_association_scope.rb` stays 3/3; `parity:api:calls` / `:args` green.
