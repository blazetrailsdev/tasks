---
title: "activerecord: reflection-slot.ts converges onto the ActiveRecord Autoload namespace"
status: draft
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: ["activerecord"]
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

Owner ruling, 2026-10-08 (blocked-story triage, decision 15): the two remaining
slot modules are debt and converge onto the `ActiveRecord` Autoload namespace.

`packages/activerecord/src/reflection-slot.ts` holds the `Reflection` module in
a zero-import slot (`_setReflection`, trails#7813). Its one reader is
`associations/builder/association.ts`, for
`Builder::Association.create_reflection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/association.rb:40-51`,
which names `ActiveRecord::Reflection.create` at call time). The cycle it
breaks is `builder/singular-association.ts -> builder/association.ts ->
reflection.ts -> associations.ts -> builder/has-one.ts`, whose
`class HasOne extends SingularAssociation` reads `SingularAssociation` in TDZ
when a builder is the entry module.

`packages/activerecord/src/namespaces.ts` already seats the other constants
this way (RFC 0151).

## Acceptance criteria

- `Reflection` is autoloaded on the `ActiveRecord` namespace and seated by
  `reflection.ts`; the reader spells `ActiveRecord.Reflection.create(...)`.
- `reflection-slot.ts` is deleted.
- A plain-node import of the built `dist/` modules with each builder as the
  entry module does not throw (a vitest run masks the TDZ).
- trails CLAUDE.md § "Call-time constant resolution" drops the
  `reflection-slot.ts` bullet.
