---
title: "Port SolidQueue::UpdateGenerator and add_batches migration template"
status: done
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: ["solid-queue-batch-models-v1-7-2"]
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10310
claim: "2026-11-18T18:51:35Z"
assignee: "solid-queue-configuration-checks-and-cli-v1-7-2"
blocked-by: null
closed-reason: null
---

## Context

solid_queue v1.7.2 adds `lib/generators/solid_queue/update/update_generator.rb` (`SolidQueue::UpdateGenerator`, `copy_new_migrations`, `--database` class option defaulting to `queue`) and its template `update/templates/db/add_batches_to_solid_queue.rb`. Neither has a TS file in `packages/solid-queue` on origin/main. `solid-queue-test-parity-sweep-v1-7-2` lists `unit/update_generator_test.rb` (5) as unported but no story owns the generator itself.

## Acceptance criteria

- `SolidQueue::UpdateGenerator` is ported at its Rails name, registered so `trails generate solid_queue:update` resolves it, and copies each `db/*.rb` template as a migration into the queue database's migrate path (`skip: true` semantics).
- The `add_batches_to_solid_queue` migration template matches the batch tables in v1.7.2's `queue_schema.rb` (as ported by `solid-queue-batch-models-v1-7-2`).
- `unit/update_generator_test.rb` is ported at its v1.7.2 test names and passes.
