---
title: "solid-queue-time-zone-iskey-drops-symbol-colon"
status: done
updated: 2026-11-23
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10623
claim: "2026-11-23T02:24:04Z"
assignee: "activejob-continuation-v8-1"
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/lib/engine.ts:47` ports `solid_queue.time_zone`
(`vendor/solid_queue/v1.7.2/lib/solid_queue/engine.rb:19-23`,
`unless config.solid_queue.key?(:time_zone)`) as
`this.config.solidQueue.isKey("timeZone")`. `OrderedOptions#isKey`
(`packages/activesupport/lib/ordered-options.ts:102-104`) answers only for the
Symbol spelling with its leading colon (`":timeZone"`), so the bare name is
always false. An app that sets `config.solid_queue.time_zone` explicitly gets it
overwritten with `app.config.time_zone`.

The same bug in `active_job.enqueue_after_transaction_commit` was fixed in
trails#10584 (`isKey(":enqueueAfterTransactionCommit")`).

## Acceptance criteria

- [ ] `engine.ts` calls `isKey(":timeZone")`, as `key?(:time_zone)` does.
- [ ] A test showing an explicitly configured `solidQueue.timeZone` survives the
      `solid_queue.time_zone` initializer fails on the old code and passes on the new.
