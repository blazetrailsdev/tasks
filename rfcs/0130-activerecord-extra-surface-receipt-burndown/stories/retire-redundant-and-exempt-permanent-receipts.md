---
title: "Retire receipts that cover no extra surface; rename PointValue to Point"
status: draft
updated: 2026-09-17
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. These receipts cover **no** extra surface:
with every receipt stripped the name is either Rails-named or exempt by kind
(`collectInterfaceOnlyNames`), so the tag asserts an absence that is not there.
Neither `parity:api:extra:gate` nor the `redundant` check sees them — the
redundant check only fires on per-name written tags a same-file allowed set
covers, not on interface-exempt names or inherited interface members.

- `connection-adapters/postgresql/oid/point.ts:5` `PointValue` — Rails names the
  value `ActiveRecord::Point = Struct.new(:x, :y)`
  (`activerecord/lib/active_record/connection_adapters/postgresql/oid/point.rb:4`).
  The remedy is the rename to `Point`, not a receipt (see also
  `pg-point-value-has-no-struct-equality`, done).
- Interface-name tags that score nothing without the tag:
  `encryption/config.ts:11` `Compressor`,
  `connection-adapters/abstract/schema-statements-like.ts:8` `SchemaStatementsLike`,
  `relation.ts:1903` `RelationScopes`.
- Interface-member coverage those tags (and the `base.ts` / `type/serialized.ts`
  interface tags) propagate to 29 members that are allowed or exempt anyway:
  `SchemaStatementsLike`'s 25 members, `base.ts` `clone` / `readAttributeForValidation` / `enum`,
  `encryption/config.ts` `deflate` / `inflate`, `type/serialized.ts` `assertValidValue`.

## Acceptance criteria

- `PointValue` is renamed `Point` at the Rails constant's seat and its receipt
  deleted.
- Each interface tag above is deleted when an A/B (delete the tag, rerun
  `API_COMPARE_FORCE=1 pnpm parity:api && pnpm parity:api:extra --package activerecord`)
  shows no change in `novel`/`moved`/`total`.
