---
title: "JoinDependency: support composite-PK model with single-column FK association join"
status: in-progress
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 4364
claim: "2026-07-01T10:24:48Z"
assignee: "cpk-join-dependency-composite-pk-single-fk"
blocked-by: null
---

## Context

`JoinDependency` cannot build a join for associations where the owning model has a composite primary key but the association uses a single-column FK via `primaryKey` override.

Repro (from `relation/delete-all.test.ts` and `relation/update-all.test.ts`):

```ts
CpkOrder.joins("orderAgreements").where("cpk_order_agreements.signature = ?", sig);
```

`CpkOrder` has `primaryKey = ["shop_id", "id"]`; `orderAgreements` joins on `cpk_order_agreements.order_id`.
`JoinDependency._buildJoinQuery` fails to resolve the FK↔PK mapping when the source model is composite-PK.

Skipped tests:

- `packages/activerecord/src/relation/delete-all.test.ts` — "delete all composite model with join subquery" (`it.skip`)
- `packages/activerecord/src/relation/update-all.test.ts` — "update all ignores order without limit from association" (CPK variant, `it.skip`)

Rails source: `activerecord/lib/active_record/associations/join_dependency.rb`

## Acceptance criteria

- Both skipped CPK join tests pass without `it.skip`.
- `JoinDependency` correctly resolves FK↔PK for composite-PK models.
- No regression in existing CPK or join tests.
