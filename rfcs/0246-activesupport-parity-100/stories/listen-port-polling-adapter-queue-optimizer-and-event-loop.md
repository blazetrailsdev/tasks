---
title: "listen-port-polling-adapter-queue-optimizer-and-event-loop"
status: draft
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
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

# port listen's polling adapter, QueueOptimizer and event loop

## Context

Split out of listen-port-polling-adapter-record-and-event-loop, which shipped
`Record` and its helpers into `packages/listen`. Still unported, under
`vendor/listen/v3.9.0/lib/listen/`: `backend.rb` (40), `adapter.rb` (43,
`Adapter.select`), `adapter/base.rb` (129), `adapter/polling.rb` (40),
`adapter/config.rb` (31), `queue_optimizer.rb` (129), `event/loop.rb` (94),
`event/processor.rb` (126), `event/queue.rb` (54), `event/config.rb` (40),
`silencer/controller.rb` (50), `thread.rb` (54). Node exposes no inotify /
FSEvents binding without a `node:` import, so Polling is the one backend.
Background work runs on a ruby-compat `Thread` (CLAUDE.md, "Every promise has
an owner").

## Acceptance criteria

- [ ] Each file above is ported into `packages/listen/lib/` with listen's names
      and control flow, async fs only.
- [ ] `Adapter.select` returns `Adapter::Polling`; `adapter/linux.rb`,
      `darwin.rb`, `bsd.rb`, `windows.rb` are permanent unported-files rows.
- [ ] `queue_optimizer_spec.rb`, `adapter/polling_spec.rb`, `adapter/base_spec.rb`,
      `event/*_spec.rb`, `silencer/controller_spec.rb` and `thread_spec.rb`
      are ported under their rspec names where they need no native backend.
