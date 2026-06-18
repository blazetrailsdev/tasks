---
title: "PG untyped-PK int8 deserialization: resolve implicit PK type on schema-cache miss"
status: claimed
updated: 2026-06-18
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: "2026-06-18T17:13:10Z"
assignee: "pg-untyped-pk-int8-deserialization"
blocked-by: null
---

## Context

Spun out of the `pg-default-pk-bigserial-cascade` campaign (RFC 0030), first PR
merged as #3485 (fixed the `find()` number↔BigInt id-match bug). This is the
**second code-bug fix**, sequenced before the `createTable` BIGSERIAL flip.

Root cause (traced on a local PG 16 lane with the core flip applied):
`packages/activerecord/src/model-schema.ts` `loadSchema` — when the schema
cache is a MISS (cleared between tests) but the model already has user-declared
attributes (`_attributeDefinitions.size > 0`), it takes the **synthesize**
branch and builds `_columnsHash` from the declared attributes only, then sets
`_schemaLoaded = true`. The implicit primary key (`id`) is NOT among the
declared attributes, so it is dropped: it gets no registered type.

Consequences once the PG default PK is `bigserial` (int8):

- `Base._castAttributeValue("id", v)` (base.ts ~1812) finds no attribute def and
  falls through to `parseInt` → returns a `number`, never `BigInt`.
- The READ path still deserializes `r.id` to `BigInt` (it consults the live
  column metadata), so input-cast (`number`) and read (`BigInt`) diverge.
- `persistence.test.ts` `update columns changing id`: `Topic.find(999)` reads
  back `refreshed.id` as the raw int8 string `"999"` (untyped → node-postgres
  int8-as-string passthrough), failing `expect(refreshed.id).toBe(999)`.

Note: `borrowSameTableColumns` only runs when `size === 0`, so partially-declared
ad-hoc models never borrow the PK from a same-table sibling. mysql masks this
(its BIGINT PK deserializes to `number`); sqlite masks it (integer PK). Only the
PG int8→BigInt path exposes it.

## Acceptance criteria

- [ ] An ad-hoc model that declares some attributes but not `id`, sharing a
      canonical table, resolves the implicit PK to the correct adapter type even
      on a schema-cache miss (so input-cast matches the read path on every lane).
- [ ] `persistence.test.ts` `update columns changing id` passes on the PG
      bigint lane without weakening the assertion.
- [ ] Green on all three lanes BEFORE the createTable flip (no-op on serial/
      integer PKs) and correct after. Test names verbatim.

## Notes

Likely fix: in the `loadSchema` synthesize branch (or `_castAttributeValue`),
resolve the PK column type from the live connection schema cache (warm by the
time `find`/read runs) instead of treating the synthesize as terminal — or
extend `borrowSameTableColumns` to merge the missing PK when `size > 0`. Must
stay adapter-correct (mysql→number, sqlite→number, PG-bigint→BigInt), so do NOT
hardcode `big_integer`.
