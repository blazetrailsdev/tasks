---
title: "cpk join-subquery tests: key where-hash on association name, not table name"
status: in-progress
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: 4400
claim: "2026-07-02T03:23:22Z"
assignee: "cpk-join-subquery-where-assoc-name-key"
blocked-by: null
---

## Context

The cpk composite-model join-subquery tests un-skipped in PR #4369
(`delete-all.test.ts:165`, `update-all.test.ts` "update all composite model with
join subquery") key their `where`-hash on the **table name**
`cpk_order_agreements`:

```ts
CpkOrder.joins("orderAgreements").where({ cpk_order_agreements: { signature } });
```

Rails uses the **association name** as the key
(`Cpk::Order.joins(:order_agreements).where(order_agreements: { signature })`,
`activerecord/test/cases/relation/delete_all_test.rb:144-148`,
`update_all_test.rb:460-464`). trails already resolves a camelCase
association-name key to the join table (PR 3124,
`where-nested-hash-assoc-name-table-resolution`), and a probe confirms
`where({ orderAgreements: { signature } })` passes. So the tests can use the
association-name key `orderAgreements` — closer to Rails' `order_agreements`
intent — instead of the raw table name.

The delete-all test's comment ("trails' where-hash keys on the actual table
name") is now inaccurate: trails DOES resolve the camelCase association name; it
just does not resolve Rails' literal snake_case `order_agreements` because the
trails association is named `orderAgreements` (camelCase naming convention). That
snake-vs-camel association-name difference is inherent, not a bug.

## Acceptance criteria

- [ ] Both cpk "composite model with join subquery" tests
      (`delete-all.test.ts`, `update-all.test.ts`) key the `where`-hash on the
      camelCase association name `orderAgreements`, not the table name
      `cpk_order_agreements`.
- [ ] Remove/replace the inaccurate "trails' where-hash keys on the actual table
      name" comment in `delete-all.test.ts`.
- [ ] Tests still pass on sqlite/pg/mysql; no test-name changes.
