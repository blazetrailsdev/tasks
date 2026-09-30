---
title: "activerecord: burn parity:api:moves' base-hosted relocations (298 methods) to zero"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps:
  [
    "moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced",
    "activerecord-inlined-bodies-report-becomes-a-gate",
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:moves` reports **947** activerecord methods "matched via include chain but living in the
wrong file" (`scripts/api-compare/moves.ts`). Most are module members reported against an including
host — e.g. `relation/query-methods.ts → relation.ts (125)` is `QueryMethods` correctly living in
`query-methods.ts` — which is the measurement fault
`moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced` (RFC 0127) fixes; RFC 0127's
`gate-the-wrong-file-moves-population` then ratchets it. This story owns the base-hosted pairs (298 methods):

- `base.ts` → `attribute-methods.ts` (29)
- `persistence.ts` → `base.ts` (28)
- `base.ts` → `core.ts` (22)
- `encryption/encryptable-record.ts` → `base.ts` (19)
- `base.ts` → `callbacks.ts` (17)
- `autosave-association.ts` → `base.ts` (15)
- `transactions.ts` → `base.ts` (15)
- `attribute-methods/dirty.ts` → `base.ts` (14)
- `nested-attributes.ts` → `base.ts` (12)
- `core.ts` → `base.ts` (11)
- `base.ts` → `querying.ts` (8)
- `attribute-assignment.ts` → `base.ts` (7)
- `base.ts` → `encryption/encryptable-record.ts` (6)
- `base.ts` → `scoping/default.ts` (6)
- `base.ts` → `timestamp.ts` (6)
- `validations.ts` → `base.ts` (5)
- `attribute-methods.ts` → `base.ts` (5)
- `attribute-methods/before-type-cast.ts` → `base.ts` (5)
- `base.ts` → `counter-cache.ts` (5)
- `base.ts` → `nested-attributes.ts` (5)
- `timestamp.ts` → `base.ts` (4)
- `associations.ts` → `base.ts` (4)
- `base.ts` → `token-for.ts` (4)
- `relation/delegation.ts` → `base.ts` (3)
- `base.ts` → `normalization.ts` (3)
- `base.ts` → `persistence.ts` (3)
- `base.ts` → `transactions.ts` (3)
- `integration.ts` → `base.ts` (2)
- `locking/optimistic.ts` → `base.ts` (2)
- `touch-later.ts` → `base.ts` (2)
- `serialization.ts` → `base.ts` (2)
- `normalization.ts` → `base.ts` (2)
- `aggregations.ts` → `base.ts` (2)
- `base.ts` → `scoping.ts` (2)
- `base.ts` → `suppressor.ts` (2)
- `base.ts` → `validations.ts` (2)
- `base.ts` → `validations/length.ts` (2)
- `base.ts` → `attribute-methods/query.ts` (1)
- `base.ts` → `attribute-methods/write.ts` (1)
- `base.ts` → `autosave-association.ts` (1)
- `model-schema.ts` → `base.ts` (1)
- `inheritance.ts` → `base.ts` (1)
- `scoping.ts` → `base.ts` (1)
- `counter-cache.ts` → `base.ts` (1)
- `attribute-methods/query.ts` → `base.ts` (1)
- `attribute-methods/primary-key.ts` → `base.ts` (1)
- `base.ts` → `model-schema.ts` (1)
- `base.ts` → `scoping/named.ts` (1)
- `base.ts` → `validations/absence.ts` (1)
- `base.ts` → `validations/numericality.ts` (1)
- `base.ts` → `validations/presence.ts` (1)

## Acceptance criteria

- [ ] After the RFC 0127 fix, every row in these pairs that `pnpm parity:api:moves` still reports is relocated to the file mirroring its defining `.rb`, or split into its own story when a pair exceeds this story.
- [ ] `pnpm parity:api:moves` reports 0 activerecord rows for these pairs.
