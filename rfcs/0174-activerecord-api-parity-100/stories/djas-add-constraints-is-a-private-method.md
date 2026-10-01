---
title: "activerecord: DisableJoinsAssociationScope#add_constraints is a #private method once parity:api credits #names"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8343. Rails' `DisableJoinsAssociationScope#add_constraints` is a private method
that replaces its parent's parameter list outright
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:36-56`,
`(reflection, key, join_ids, owner, ordered)`, against `AssociationScope#add_constraints(scope,
owner, chain)` at `associations/association_scope.rb:123`).

trails ports it as an exported `this`-typed module function, `addConstraints`, in
`packages/activerecord/src/associations/disable-joins-association-scope.ts`, called as
`addConstraints.call(this, …)`, and reaching `evalScope` through a cast because the function is not
a class member. Two things forced that:

- TypeScript rejects a derived member whose parameter types are unrelated to the base member's
  (TS2416 / TS2684), and a base `private` member cannot be redeclared (TS2415).
- A JS `#addConstraints` method on each class would satisfy TypeScript — `#` names are per-class —
  but `scripts/api-compare/extract-ts-api.ts` records a `PrivateIdentifier` member under its
  `#`-prefixed text, so `parity:api` does not credit it against `add_constraints` and the body pins
  go stale (seen on #8343: both `associations/association_scope.rb:add_constraints` and
  `associations/disable_joins_association_scope.rb:add_constraints` reported STALE).

## Converged shape

`getMemberName` in `extract-ts-api.ts` strips the leading `#` so a `#private` method is credited by
name, with `private` visibility. `AssociationScope` and `DisableJoinsAssociationScope` then each
declare `#addConstraints` as a method, and the module function and its `evalScope` cast go.

## Acceptance criteria

- [ ] `parity:api` credits a `#name` method against the Ruby method `name`.
- [ ] `add_constraints` is a `#addConstraints` method on both classes; no exported `addConstraints`
      function in `disable-joins-association-scope.ts`.
- [ ] `pnpm parity:api:pins`, `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` stay green.
