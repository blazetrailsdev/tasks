---
title: "activerecord: seven bodies test instanceof where Rails asks respond_to? / acts_like?"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["pg-translate-exception-respond-to-result"]
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

`pnpm parity:api:duck-types` lists 8 activerecord pairs whose Rails body duck-types and whose port uses
`instanceof`: `attribute-methods/time-zone-conversion.ts#cast` (2),
`abstract/database-statements.ts#toSqlAndBinds`, `postgresql/oid/timestamp-with-time-zone.ts#castValue`,
`enum.ts#_enum`, `migration.ts#revert`, `relation/calculations.ts#executeGroupedCalculation` (2),
`type/serialized.ts#isForceEquality`. (`postgresql-adapter.ts#translateException` is owned by
`pg-translate-exception-respond-to-result`, RFC 0082.) CLAUDE.md: `respond_to?` is `rbObjRespondTo`,
`acts_like?` is ActiveSupport's `actsLike`.

## Acceptance criteria

- [ ] Each body asks what Rails asks; `pnpm parity:api:duck-types` lists no activerecord pair once the RFC 0082 story lands.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
