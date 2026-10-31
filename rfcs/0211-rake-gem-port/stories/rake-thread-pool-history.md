---
title: "Port Rake thread history for --job-stats=history"
status: draft
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`--job-stats=history` has no path: `Application#run_with_threads` (`vendor/rake/v13.2.1/lib/rake/application.rb:145,155`) calls `thread_pool.gather_history` and `ThreadHistoryDisplay.new(thread_pool.history).show`. `packages/rake/src/thread-pool.ts` and `promise.ts` omit `gather_history`, `history`, `stat` and `recorder` (`thread_pool.rb:69-90,144-154`, `promise.rb:12,98-100`), and `thread_history_display.rb` is unported. All are in the rake `SCOPED_SKIP_GROUPS` entry in `scripts/parity/conventions.ts`, whose reason is that events key on `Thread.current`. A worker in `ThreadPool#startThread` is a promise `t`, which could carry that key.

## Acceptance criteria

- [ ] `gatherHistory`, `history`, `stat` and the `Promise` recorder are ported, keyed on the running worker, with `main` for a chore run from `value`.
- [ ] `ThreadHistoryDisplay` is ported and `runWithThreads` calls it under `jobStats === "history"`.
- [ ] The names leave `SCOPED_SKIP_GROUPS`.
