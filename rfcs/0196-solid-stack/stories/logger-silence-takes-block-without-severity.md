---
title: "logger-silence-takes-block-without-severity"
status: draft
updated: 2026-11-18
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

`Poller#with_polling_volume` calls `ActiveRecord::Base.logger.silence { yield }` (`vendor/solid_queue/v1.7.2/lib/solid_queue/processes/poller.rb:44-52`), passing only a block. trails' `packages/solid-queue/lib/processes/poller.ts` writes `logger.silence(undefined, () => block())` because `LoggerSilence#silence` (`packages/activesupport/lib/logger-silence.ts:18`) takes `(severity = ERROR, fn)` positionally, so `parity:api:calls:args` reports `with_polling_volume silence()`. The same shape sits at `actionpack/.../debug-view.ts:78`, `activesupport/lib/benchmarkable.ts:68` and `solid-cable/.../solid-cable.ts:187`.

## Acceptance criteria

- `silence` accepts a block without a placeholder severity (Rails `def silence(severity = Logger::ERROR)` + `&block`, `activesupport/lib/active_support/logger_silence.rb`), using the repo's block idiom.
- The four call sites pass only the block, and poller.ts's `@missingRailsArgs silence` receipt is removed.
