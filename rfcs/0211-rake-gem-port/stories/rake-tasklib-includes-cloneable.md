---
title: "Port Rake::Cloneable and include it in TaskLib"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/rake/src/tasklib.ts` omits `include Cloneable` (`vendor/rake/v13.2.1/lib/rake/tasklib.rb:8`). `cloneable.rb:6-13` defines `initialize_copy`, which clones each instance variable and keeps the source value where `clone` raises.

## Acceptance criteria

- [ ] `Rake::Cloneable` is ported at `packages/rake/src/cloneable.ts` as a plain-object module whose `initializeCopy` the `rbObjDup` / `rbObjClone` protocol dispatches.
- [ ] `TaskLib` includes it before `DSL`, and a test shows a dup does not share instance-variable values.
