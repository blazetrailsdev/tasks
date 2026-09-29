---
title: "Port QueueAdapters::TestAdapter and add the AJ_ADAPTER=test CI lane"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-enqueuing-and-configured-job"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/test_adapter.rb` (86 lines): six `attr_accessor`s
(`perform_enqueued_jobs`, `perform_enqueued_at_jobs`, `filter`, `reject`,
`queue`, `at`, `:15`) and two `attr_writer`s (`:16`); lazy `enqueued_jobs` /
`performed_jobs` (`:19-26`); `enqueue` / `enqueue_at` (`:28-36`); private
`job_to_hash` (`:39-46`), `perform_or_enqueue` (`:48-55`, awaiting
`Base.execute`), `filtered?` / `filtered_time?` / `filtered_queue?` /
`filtered_job_class?` / `filter_as_proc` (`:57-84`).

**CI lane.** Add the `AJ_ADAPTER=test` invocation of `packages/activejob`. Its
setup file ports `vendor/rails/v8.0.2/activejob/test/adapters/test.rb`: `queue_adapter = :test`,
`perform_enqueued_jobs = true`, `perform_enqueued_at_jobs = true`. Every case
already ported runs in it; a failure only in this lane usually means a port
dropped an `adapter_is?` arm the Rails test has. File each one beyond this
story's budget as a story in this RFC with its Rails `file:line`.

## Fidelity traps (predicted at authoring)

- [ ] **Mixed key kinds.** `job_to_hash` adds Symbol keys (`:job`, `:args`, `:queue`, `:priority`, and `:at` from `extras`) to `serialize`'s String keys (`:40-45`). `TestHelper#assert_enqueued_with` `inspect`s these hashes into its failure message and `test_helper_test.rb:739-740` asserts it, so Symbol-ness is observable: apply CLAUDE.md's `symbolize_keys` rule and write the decision at `job_to_hash`.
- [ ] **`job_data.fetch("arguments")`** (`:42-44`) raises `KeyError` on a missing key; it is not `?? undefined`.
- [ ] **`perform_enqueued_jobs && !filtered?(job)`** (`:30`): `perform_enqueued_jobs` is `nil` by default (`test_case_test.rb` "does not perform enqueued jobs by default" asserts `nil`, not `false`).
- [ ] **Filters.** `filter` / `reject` may be a Proc, a class, or an Array of classes (`filter_as_proc`, `:79-84`, with `Array(filter)`); `queue` compares `job.queue_name` with `queue.to_s` (Symbol colon stripped); `at` compares `scheduled_at` with `at.to_f`.
- [ ] **`performed_jobs << job_data` happens before `Base.execute`** (`:50-51`), so a job that raises is still recorded as performed.

## Acceptance criteria

- [ ] `test_adapter.rb` reads complete in `parity:api`.
- [ ] CI runs the `test` lane and it is green.

## Definition of done

Removing an `adapter_is?` guard so a case runs in the `inline` lane does not close this story.
