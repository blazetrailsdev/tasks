---
title: "Port Connection::Identification and Connection::Authorization"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-namespace-and-internal-constants"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/identification.rb` (49 lines) and
`connection/authorization.rb` (18), Tier 1.

`Identification`:

- `included do class_attribute :identifiers, default: Set.new end`
  (`:10-12`).
- `identified_by(*identifiers)` (`:21-24`):
  `Array(identifiers).each { |identifier| attr_accessor identifier }`, then
  `self.identifiers += identifiers`.
- `connection_identifier` (`:29-35`), memoized with
  `unless defined? @connection_identifier`.
- Private `connection_gid(ids)` (`:38-46`).

`Authorization`: `UnauthorizedError < StandardError` and
`reject_unauthorized_connection` (`:8-15`), which logs and raises.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/identification.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/authorization.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`identifiers` is a `Set`** and `+=` builds a new one, so a subclass's identifiers do not leak into `Connection::Base`. Use `classAttribute()`.
- [ ] **`attr_accessor identifier` generates a reader and a writer per identifier.** A zero-arg Ruby reader is an accessor property in trails (CLAUDE.md § "Generated attribute readers are properties"): `connection.currentUser`, with `connection.currentUser = …` writing the ivar `connection_identifier` reads back by name. `Channel::Base#delegate_connection_identifiers` then calls `connection.send(identifier)`.
- [ ] **`unless defined? @connection_identifier`** memoizes a nil result too; `||=` would recompute it. Rails' `multiple_identifiers_test.rb` and `identifier_test.rb` read it before and after `connect`.
- [ ] **`filter_map { |id| instance_variable_get("@#{id}") }`** drops nil and false identifiers.
- [ ] **`connection_gid`**: `to_gid_param` when the object responds to it, else `to_s`; then `sort.join(":")`. The sort is on the strings.
- [ ] **`identified_by` takes Symbols**; in trails the names are camelCase strings and the ivar name follows.
- [ ] **`reject_unauthorized_connection` logs at error** before raising, through the connection's tagged logger.
- [ ] **A new error class with a constructor raises `extra:gate`'s `total`.** `UnauthorizedError` has no constructor in Rails; give it none.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`.
- [ ] A `.trails.test.ts` on a minimal host covers subclass isolation of `identifiers`, the generated accessor, a memoized nil identifier, and the sorted join with a GlobalID-answering object.

## Definition of done

`identifiers` as a shared mutable array does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/identification.trails.test.ts packages/actioncable/src/connection/authorization.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
