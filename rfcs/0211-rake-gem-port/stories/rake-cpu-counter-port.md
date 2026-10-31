---
title: "rake-cpu-counter-port"
status: ready
updated: 2026-10-31
rfc: "0211-rake-gem-port"
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

`Rake.suggested_thread_count` (`packages/rake/src/rake-module.ts`) calls Node's `availableParallelism` where `vendor/rake/v13.2.1/lib/rake/rake_module.rb` calls `Rake::CpuCounter.count + 4`. `vendor/rake/v13.2.1/lib/rake/cpu_counter.rb` is unported, and `test_rake_cpu_counter.rb` has no port.

## Acceptance criteria

- [ ] `Rake::CpuCounter` is ported at `packages/rake/src/cpu-counter.ts`, `suggestedThreadCount` calls `CpuCounter.count()`, and the `count` receipt is removed.
