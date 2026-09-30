---
title: "activemodel: burn parity:api:moves' 150 include-chain relocations to zero"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: placement
packages: ["activemodel"]
deps: ["moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:moves` reports **150** activemodel methods matched through an include chain but
living in a different file. Largest pairs:

- `model.ts` → `api.ts` (11)
- `validations.ts` → `api.ts` (11)
- `validations.ts` → `model.ts` (11)
- `api.ts` → `validations.ts` (11)
- `attribute-methods.ts` → `attributes.ts` (10)
- `attribute-methods.ts` → `dirty.ts` (9)
- `type/helpers/numeric.ts` → `type/decimal.ts` (7)
- `type/helpers/numeric.ts` → `type/float.ts` (7)
- `type/helpers/time-value.ts` → `type/date-time.ts` (6)
- `attribute-assignment.ts` → `api.ts` (5)
- `attribute-assignment.ts` → `model.ts` (5)
- `type/helpers/numeric.ts` → `type/integer.ts` (5)
- `type/helpers/time-value.ts` → `type/time.ts` (5)
- `model.ts` → `validations.ts` (5)
- `conversion.ts` → `api.ts` (4)
- `conversion.ts` → `model.ts` (4)
- `validations/clusivity.ts` → `validations/exclusion.ts` (4)
- `validations/clusivity.ts` → `validations/inclusion.ts` (4)
- `forbidden-attributes-protection.ts` → `api.ts` (2)
- `validations/length.ts` → `api.ts` (2)

Most are module members reported once per including host (`validations.ts` → `api.ts`/`model.ts`,
`type/helpers/numeric.ts` → `decimal.ts`/`float.ts`/`integer.ts`), which is the measurement fault
`moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced` (RFC 0127) fixes.

## Acceptance criteria

- [ ] After the RFC 0127 moves fix, every activemodel row `pnpm parity:api:moves` still reports is relocated to the file mirroring its defining `.rb`.
- [ ] `pnpm parity:api:moves` reports 0 activemodel rows.
