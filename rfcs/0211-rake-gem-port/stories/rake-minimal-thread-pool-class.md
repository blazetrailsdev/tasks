---
title: "rake-minimal-thread-pool-class"
status: claimed
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-31T14:56:40Z"
assignee: "rake-minimal-thread-pool-class"
blocked-by: null
closed-reason: null
---

## Context

`Rake::Application#run_with_threads` reads `thread_pool.statistics` (`vendor/rake/v13.2.1/lib/rake/application.rb:150-153`, `thread_pool.rb:83-88`). `packages/rake/src/application.ts` `threadPool` is an inline object counted from `Task#invokePrerequisitesConcurrently`, and `SCOPED_SKIP_GROUPS` lists `ThreadPool` as unported.

## Acceptance criteria

- [ ] `threadPool` is a minimal `ThreadPool` class in `thread-pool.ts` with `statistics` at its Rails name, or the repo owner rules the inline object permanent.
- [ ] The `threadPool` receipt is deleted.
