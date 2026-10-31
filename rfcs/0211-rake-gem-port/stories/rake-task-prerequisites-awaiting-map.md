---
title: "rake-task-prerequisites-awaiting-map"
status: done
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9526
claim: "2026-10-31T12:36:54Z"
assignee: "rake-task-prerequisites-awaiting-map"
blocked-by: null
closed-reason: null
---

## Context

`Task#prerequisite_tasks` and `#investigation` (`vendor/rake/v13.2.1/lib/rake/task.rb:61-63`, `:366`) call `map` with a block that is async in trails (`packages/rake/src/task.ts`), so the port loops sequentially and the call gate reports `map`.

## Acceptance criteria

- [ ] Both bodies call a sequential awaiting `map`, keeping Rails' side-effect order, and their `@missingRailsCall map` tags are removed.
