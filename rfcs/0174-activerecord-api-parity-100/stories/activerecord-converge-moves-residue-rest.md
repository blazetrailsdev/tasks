---
title: "activerecord: burn parity:api:moves' rest relocations (31 methods) to zero"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps: ["moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced"]
deps-rfc: []
est-loc: 300
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
`gate-the-wrong-file-moves-population` then ratchets it. This story owns the rest pairs (31 methods):

- `encryption/configurable.ts` → `encryption.ts` (12)
- `encryption/contexts.ts` → `encryption.ts` (8)
- `attribute-methods/primary-key.ts` → `attribute-methods.ts` (3)
- `attribute-methods/read.ts` → `attribute-methods.ts` (2)
- `associations/has-many-association.ts` → `associations/foreign-association.ts` (1)
- `associations/has-many-through-association.ts` → `associations/through-association.ts` (1)
- `attribute-methods/write.ts` → `attribute-methods.ts` (1)
- `attribute-methods/dirty.ts` → `attribute-methods.ts` (1)
- `attribute-methods.ts` → `attribute-methods/dirty.ts` (1)
- `type/date.ts` → `type/internal/timezone.ts` (1)

## Acceptance criteria

- [ ] After the RFC 0127 fix, every row in these pairs that `pnpm parity:api:moves` still reports is relocated to the file mirroring its defining `.rb`, or split into its own story when a pair exceeds this story.
- [ ] `pnpm parity:api:moves` reports 0 activerecord rows for these pairs.
