---
title: "activerecord: SingularAssociation#reader and Association#reload branch on a promise-or-value load_target"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `singular-association-find-target-and-reader-take-rails-bodies`, whose PR converged
`Association#findTarget` and `SingularAssociation#findTarget` onto Rails' bodies but left two
promise-or-value arms in place. Both now carry `@inventedArm if — CONVERGEABLE` receipts pointing
here.

- `SingularAssociation#reader` (`packages/activerecord/src/associations/singular-association.ts`).
  Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/singular_association.rb:7-15`)
  is `reload` under `if !loaded? || stale_target?`, then `target`. The trails getter adds
  `if (reloaded instanceof Promise) return reloaded.then(() => this.target)`.
- `Association#reload` (`packages/activerecord/src/associations/association.ts`). Rails
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:72-78`) is
  `load_target` then `self unless target.nil?`. The port branches on
  `loaded instanceof Promise` because `loadTarget` answers a value when `find_target?` is false and
  a promise when it queries.

The value arm is load-bearing. A generated association reader is a property, and on a new owner
with no foreign key `find_target?` is false, so `new Pirate().ship` answers `null` with no query.
The synchronous paths RFC 0087 keeps depend on that: `assignNestedAttributesForOneToOneAssociation`
reads the existing record inside `new Pirate({ shipAttributes })`, and `if (!pirate.ship)` must not
see a truthy promise. Making `reload` `async` and the reader `reload().then(...)` was considered in
the splitting PR and not taken for that reason.

This is the same promise-or-value continuation the owner triaged for
`assign-attributes-pending-promise-chain-arms` (2026-10-08), which waits on
`reopen-rfc-0087-constructor-arm-for-association-io-at-assignment`.

## Acceptance criteria

- [ ] `SingularAssociation#reader` and `Association#reload` take Rails' arms only, or the
      value-or-promise reader is ratified by the repo owner in `packages/activerecord/CLAUDE.md` and
      the two receipts become `PERMANENT`.
- [ ] `pnpm parity:api:arms:throws` green.
