---
title: "ruby-compat: new Thread drops Thread.new's block arguments, so the reaper closes over frequency"
status: done
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: [ruby-compat, activerecord]
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: trails#8976
claim: "2026-10-16T13:44:52Z"
assignee: "async-queries-session-atomic-boolean-and-read-write-lock"
blocked-by: null
closed-reason: null
---

## Context

`Thread.new(*args, &block)` passes `args` to the block (`vendor/ruby/v3.3.11/thread.c` `thread_s_new` / `thread_create_core`). `ConnectionPool::Reaper#run` relies on that: `Thread.new(frequency) do |t| ... sleep t ... end` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/reaper.rb:41`).

ruby-compat's `Thread` constructor takes only the block, `constructor(block: () => R)` (`packages/ruby-compat/src/thread.ts:101`). So the reaper captures the value in a closure instead: `new Thread(async () => { const t = frequency; ... })` (`packages/activerecord/src/connection-adapters/abstract/connection-pool/reaper.ts:47-48`).

## Acceptance criteria

- [ ] `new Thread(...args, block)` hands `args` to the block, as `Thread.new` does, with its MRI citation and unit tests. Existing block-only callers keep working.
- [ ] `Reaper#run` passes `frequency` to `new Thread`, and the block takes `t`.
- [ ] `pnpm parity:api:calls:args` shows no new row for `reaper.rb`. Any row this converges is deleted by hand.

## Verification

```bash
pnpm parity:api:calls:args && pnpm vitest run packages/ruby-compat/src/thread packages/activerecord/src/connection-adapters/abstract/connection-pool
```
