---
title: "solid-queue-models-named-under-solid-queue-namespace"
status: draft
updated: 2026-10-26
rfc: "0196-solid-stack"
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

Rails applies `SolidQueue::Record`'s table prefix through `isolate_namespace`
(`vendor/rails/v8.0.2/railties/lib/rails/engine.rb`, `isolate_namespace`
defining `SolidQueue.table_name_prefix`) and
`ModelSchema.full_table_name_prefix`'s `module_parents` walk
(`packages/activerecord/src/model-schema.ts` `fullTableNamePrefix`). In trails
the solid-queue models are named bare (`rbModName(Job) === "Job"`), so the walk
never reaches `SolidQueue`, and the `solid_queue_record` load hook in
`packages/solid-queue/src/engine.ts` seats `this.tableNamePrefix =
SolidQueue.tableNamePrefix` instead. Removing that line and the
`tableNamePrefix: "solid_queue_"` default in `solid-queue.ts` turns 87 of 97
solid-queue tests red ("no such table: jobs").

## Acceptance criteria

- Every `app/models/solid_queue/*` port is named `SolidQueue::<Name>`
  (`registerConstant`, as `recurring-job.ts` does), with model_name / STI
  checked.
- The `tableNamePrefix` line in the engine hook and the default in
  `solid-queue.ts` are removed; the prefix comes from `isolateNamespace`.
