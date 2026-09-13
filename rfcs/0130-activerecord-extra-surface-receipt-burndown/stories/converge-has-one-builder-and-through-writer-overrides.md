---
title: "converge-has-one-builder-and-through-writer-overrides"
status: ready
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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
closed-reason: null
---

## Context

Surfaced by `receipt-moved-associations-and-attribute-methods` (RFC 0130). These
names score `moved` in `parity:api:extra` and carry
`@noRailsEquivalent CONVERGEABLE converge-has-one-builder-and-through-writer-overrides`
receipts until they converge.

- `packages/activerecord/src/associations/builder/has-one.ts`
  - `HasOne.build` — Rails `Builder::HasOne` defines no `build`; it inherits
    `Builder::Association.build` (`activerecord/lib/active_record/associations/builder/association.rb`).
    The TS override swallows a hash-as-scope and raises on `counterCache`; both
    belong in `valid_options` / `Association.build`'s own flow
    (`builder/has_one.rb:9-15`).
  - `HasOne.defineConstructors` — Rails defines `build_#{name}` once in
    `Builder::SingularAssociation.define_constructors`
    (`builder/singular_association.rb:30-45`); the has_one-specific load-before-build
    branch should move there or into the association.
  - `HasOne.defineWriters` — inherited `Builder::Association.define_writers`
    (`builder/association.rb`); the `set${Name}` / `name=` shims duplicate it.
- `packages/activerecord/src/associations/has-one-through-association.ts`
  - `reset` — Rails `HasOneThroughAssociation` does not define `reset`; the
    inherited `SingularAssociation#reset` (`associations/singular_association.rb:18`)
    applies. The override only clears trails-invented `_pendingReplace` state.
  - `writer` — Rails inherits `SingularAssociation#writer`
    (`singular_association.rb:25`) which calls `replace(record)`; Rails'
    `replace(record, save = true)` (`has_one_through_association.rb:10`) does the
    through-record creation in line. The TS override defers it via `persistReplace`.

## Acceptance criteria

- Each of the five overrides is deleted and its behavior lives at the Rails home cited above.
- The five `CONVERGEABLE` receipts are removed and `pnpm parity:api:extra:tighten` narrows activerecord's `total`.
- has_one / has_one :through association suites stay green.
