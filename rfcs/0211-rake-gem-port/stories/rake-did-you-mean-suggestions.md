---
title: "rake-did-you-mean-suggestions"
status: done
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9498
claim: "2026-10-30T17:24:11Z"
assignee: "rake-did-you-mean-suggestions"
blocked-by: null
closed-reason: null
---

## Context

`generate_did_you_mean_suggestions` (`vendor/rake/v13.2.1/lib/rake/task_manager.rb:68-79`) answers "" in `packages/rake/src/task-manager.ts` because rake depends on ruby-compat only, while `@blazetrails/did-you-mean` is a separate package.

## Acceptance criteria

- [ ] An undefined task's message carries `DidYouMean::SpellChecker` suggestions over the task names, as `task_manager.rb:71-78` does, and the `@missingRailsCall` receipt is removed.
