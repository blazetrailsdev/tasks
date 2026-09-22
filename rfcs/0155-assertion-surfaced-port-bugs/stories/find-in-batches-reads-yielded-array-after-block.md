---
title: "find-in-batches-reads-yielded-array-after-block"
status: ready
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
closed-reason: null
---

## Context

Rails `batches_test.rb:185-198` (`test_find_in_batches_should_not_use_records_after_yielding_them_in_case_original_array_is_modified`)
replaces every yielded batch element with a stub whose `id` raises (`batch.map! { not_a_post }`) and asserts
nothing raised. Ported, `Post.findInBatches({ batchSize: 1 })` then fails with
`TypeError: Cannot use 'in' operator to search for 'id' in undefined`: the port reads the yielded array
after the block instead of what Rails holds (`relation/batches.rb` `find_in_batches` -> `in_batches` uses its own `ids`/`records`).
The trails test keeps only the `splice` arm meanwhile. Cause not investigated beyond the error.

## Acceptance criteria

- The test body mutates the batch as Rails does (`map!` to a raising stub) and passes.
