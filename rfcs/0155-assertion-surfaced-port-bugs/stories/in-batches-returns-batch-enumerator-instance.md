---
title: "in-batches-returns-batch-enumerator-instance"
status: closed
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered: inBatches without a block returns BatchEnumerator (relation/batches.ts:111,139; class at relation/batches/batch-enumerator.ts:13) and batches.test.ts:388 asserts toBeInstanceOf(BatchEnumerator) since trails#7896 (e40d56f3b9)."
---

## Context

Rails `vendor/rails/activerecord/lib/active_record/relation/batches.rb` defines `ActiveRecord::Batches::BatchEnumerator`
(`batches/batch_enumerator.rb`); `batches_test.rb:313-317` (`test_in_batches_should_not_execute_any_query`) asserts
`assert_kind_of ActiveRecord::Batches::BatchEnumerator, Post.in_batches(of: 2)`. trails' `Relation#inBatches`
(`packages/activerecord/src/relation/batches.ts:103`) returns an async generator, and there is no `BatchEnumerator`
class, so `packages/activerecord/src/batches.test.ts` "in batches should not execute any query" cannot assert the
Rails kind (still an assertion-kind mismatch).

## Acceptance criteria

- `inBatches` without a block returns a `BatchEnumerator`; the test asserts `toBeInstanceOf(BatchEnumerator)`.
