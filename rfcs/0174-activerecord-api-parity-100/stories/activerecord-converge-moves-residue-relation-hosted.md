---
title: "activerecord: burn parity:api:moves' relation-hosted relocations (300 methods) to zero"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps: ["moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced"]
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
`gate-the-wrong-file-moves-population` then ratchets it. This story owns the relation-hosted pairs (300 methods):

- `relation/query-methods.ts` → `relation.ts` (125)
- `relation.ts` → `relation/query-methods.ts` (55)
- `relation/finder-methods.ts` → `relation.ts` (41)
- `relation/calculations.ts` → `relation.ts` (26)
- `relation/delegation.ts` → `relation.ts` (23)
- `relation/batches.ts` → `relation.ts` (14)
- `relation/spawn-methods.ts` → `relation.ts` (6)
- `explain.ts` → `relation.ts` (3)
- `relation.ts` → `relation/delegation.ts` (2)
- `relation.ts` → `signed-id.ts` (2)
- `relation.ts` → `token-for.ts` (2)
- `relation.ts` → `relation/finder-methods.ts` (1)

## Acceptance criteria

- [ ] After the RFC 0127 fix, every row in these pairs that `pnpm parity:api:moves` still reports is relocated to the file mirroring its defining `.rb`, or split into its own story when a pair exceeds this story.
- [ ] `pnpm parity:api:moves` reports 0 activerecord rows for these pairs.

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
