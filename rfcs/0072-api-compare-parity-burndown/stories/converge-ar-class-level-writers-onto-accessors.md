---
title: "converge-ar-class-level-writers-onto-accessors"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From the `audit-set-prefixed-writers-for-accessor-convergence` inventory.
`scripts/api-compare/conventions.ts` maps a Ruby writer `foo=` onto the SAME
camelCase name as its reader, so an `export function setFoo` sibling is TS
surface Rails does not have.

Four ActiveRecord modules port a Rails class-level reader/writer pair as
`export function foo` plus `export function setFoo`:

- `packages/activerecord/src/inheritance.ts:461` `setAbstractClass` —
  Rails `abstract_class=` in
  `vendor/rails/activerecord/lib/active_record/inheritance.rb`
- `packages/activerecord/src/locking/optimistic.ts:29` `setLockingColumn` —
  Rails `locking_column=` in
  `vendor/rails/activerecord/lib/active_record/locking/optimistic.rb`
- `packages/activerecord/src/signed-id.ts:78` `setSignedIdVerifier` —
  Rails `signed_id_verifier=` in
  `vendor/rails/activerecord/lib/active_record/signed_id.rb`
- `packages/activerecord/src/type.ts:100` `setRegistry` — Rails `registry=`
  in `vendor/rails/activerecord/lib/active_record/type.rb`

Each reader lives in the same TS file. Note these are class-level (they take a
`modelClass` argument rather than using `this`), so converging means moving the
pair onto a class module whose static accessors are installed on `Base` —
check whether `Base` already carries a static accessor for the same name
before adding one.

The converged shape is an exported class module holding the pair under the
Rails name, mixed in via `include()` / `extend()` from
`@blazetrails/activesupport`. Exemplar:
`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`.

## Acceptance criteria

- Each `set`-prefixed export replaced by the accessor shape under the Rails
  name, or documented with a concrete reason it cannot be.
- Model-level call sites updated.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags.
- Touched activerecord test files stay green.
