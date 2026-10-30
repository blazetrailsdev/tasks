---
title: "SolidQueueAdapter is found by queue_adapter = :solid_queue"
status: draft
updated: 2026-10-30
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

`config.activeJob.queueAdapter = "solid_queue"` — the way solid_queue's README
and its own dummy app configure it (`test/dummy/config/application.rb:30`) —
raises `NameError: uninitialized constant ActiveJob::QueueAdapters::SolidQueueAdapter`
at boot. `QueueAdapters.lookup` is `rbModConstGet(QueueAdapters, ...)`, and
`solid-queue-adapter.ts` only calls `registerConstant` with the qualified name,
which does not attach the class to the `QueueAdapters` module object.
activejob's own adapters attach themselves (`QueueAdapters.InlineAdapter = ...`).

Rails gets this from `module ActiveJob; module QueueAdapters; class
SolidQueueAdapter` reopening the namespace (`solid_queue_adapter.rb:3-10`).

Found by trailmap, the first application to configure Solid Queue by name
(every trails test passes `new SolidQueueAdapter()`).

## Acceptance

- `QueueAdapters.lookup("solid_queue")` returns `SolidQueueAdapter`, with a test.
