---
title: "rake-did-you-mean-suggestions"
status: ready
updated: 2026-10-30
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

`generate_did_you_mean_suggestions` (`vendor/rake/v13.2.1/lib/rake/task_manager.rb:68-79`) answers "" in `packages/rake/src/task-manager.ts` because rake depends on ruby-compat only, while `@blazetrails/did-you-mean` is a separate package.

## Acceptance criteria

- [ ] An undefined task's message carries `DidYouMean::SpellChecker` suggestions over the task names, as `task_manager.rb:71-78` does, and the `@missingRailsCall` receipt is removed.
