---
title: "activerecord: DisableJoinsAssociationScope#add_constraints keeps Rails' signature (arity 3730/3731)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: ["add-constraints-guards-constraints-call-and-lambda-type"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The single activerecord arity mismatch: `DisableJoinsAssociationScope#add_constraints(reflection, key,
join_ids, owner, ordered)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:33`)
is inherited in trails as `AssociationScope#addConstraints(scope, owner, chain)` while the port's own
implementation hides under a private `_addConstraintsDj`
(`packages/activerecord/src/associations/disable-joins-association-scope.ts:111`). That is a renamed
method (Rails' name on the wrong signature) plus an override-arity case CLAUDE.md § "Override arity"
settles with a `..._rest: unknown[]` on the base. `add-constraints-guards-constraints-call-and-lambda-type`
(RFC 0023) fixes guards inside the same body.

## Acceptance criteria

- [ ] `_addConstraintsDj` is renamed to the `addConstraints` override with Rails' five parameters, the base `AssociationScope#addConstraints` takes `..._rest: unknown[]` per CLAUDE.md § "Override arity".
- [ ] `pnpm parity:api` activerecord arity **3731/3731**; `pnpm parity:api:params` green.
