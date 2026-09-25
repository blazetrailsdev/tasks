---
title: "find-in-batches-reads-yielded-array-after-block"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8069
claim: "2026-09-24T23:44:14Z"
assignee: "reset-callbacks-does-not-remove-from-descendants"
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
