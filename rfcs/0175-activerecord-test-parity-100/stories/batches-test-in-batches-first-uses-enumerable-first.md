---
title: "activerecord: batches.test.ts ports in_batches(...).first and reverse_each.first through Enumerable"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8854
claim: "2026-10-13T12:42:25Z"
assignee: "activerecord-delegation-records-test-array-respond-to"
blocked-by: null
closed-reason: null
---

## Context

trails#8807 added `first` to ruby-compat's `AsyncEnumerable`
(`packages/ruby-compat/src/enumerable.ts`, `enum_first`,
`vendor/ruby/v3.3.11/enum.c:1284`) and declared it on `BatchEnumerator`
(`packages/activerecord/src/relation/batches/batch-enumerator.ts`), and used it
in the three `Cpk::Book` cases. The other `EachTest` cases in
`packages/activerecord/src/batches.test.ts` that Rails writes with
`in_batches(...).first` still open-code it as a `for await ... break` loop over
an `any`-typed local, and compare ids as strings where Rails compares records:

- `vendor/rails/v8.0.2/activerecord/test/cases/batches_test.rb:600`
  `Post.in_batches(of: 1, start: 2).first`
- `:678` `Post.in_batches(of: 1, order: :desc).first`
- `:1008` `Cpk::Order.in_batches(of: 1, start: order.id).first`
- `:1021` `Cpk::Order.where(...).in_batches(of: 1).first`

`:608` and `:1014` are `in_batches(...).reverse_each.first`;
`Enumerable#reverse_each` (`enum.c:2772`) is not on `AsyncEnumerable`, and the
trails bodies collect every batch into an array and take the last.

## Acceptance criteria

- [ ] The four `.first` cases call `.inBatches(...).first()` and assert with
      `assertEqual` on the records, as the Rails bodies do; test names
      unchanged.
- [ ] `AsyncEnumerable` carries `reverseEach`, and the two `reverse_each.first`
      cases use it.
- [ ] `pnpm parity:test:assertions` stays green.
