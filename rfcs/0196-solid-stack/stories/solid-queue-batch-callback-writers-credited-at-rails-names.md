---
title: "Credit Batch::Callbacks on_finish=/on_success=/on_failure= at their Rails names"
status: in-progress
updated: 2026-11-18
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10323
claim: "2026-11-18T21:37:12Z"
assignee: "around-callback-conditions-await-thenables"
blocked-by: null
closed-reason: null
---

## Context

`Batch::Callbacks` (`vendor/solid_queue/v1.7.2/app/models/solid_queue/batch/callbacks.rb:8-16`) defines `on_finish=` / `on_success=` / `on_failure=`, each `super serialize_callback(callback)`. trails (`packages/solid-queue/lib/batch/callbacks.ts`) installs them as the setter half of an `on_${type}` accessor through `Object.defineProperty` in the `included` hook, because the batch columns are snake-case attributes. `parity:api --package solid-queue` still lists `Callbacks#onFinish`, `#onSuccess`, `#onFailure` (and the same on `batch.rb`) as missing.

## Acceptance criteria

- The three writers are credited at their Rails names, either by matching the attribute-writer spelling the convention expects or by teaching the comparer that a snake-case attribute writer override is the ported `x=`.
- `parity:api --package solid-queue` shows `batch/callbacks.rb` at 6/6.
