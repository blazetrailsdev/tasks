---
title: "trailties: Thor Actions/Invocation/Shell and test_help reopenings drop ruby-compat Module"
status: ready
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["trailties"]
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

`trailties-drop-ruby-compat-module-class` (trails#9101) left these ruby-compat `new Module(...)` sites in `packages/trailties/src` (origin/main, 2026-10-21):

- `thor/actions.ts:387` `Actions` (`_sharedConfiguration` calls `superMethod`, into `Invocation`)
- `thor/invocation.ts:171` `Invocation` (the `super` target of `Actions`)
- `thor/shell.ts:30` (an anonymous `new Module()`)
- `test-help.ts:48,57`: two `reopening` modules whose `beforeSetup` calls `superMethod` (Rails `railties/lib/rails/test_help.rb` reopens `ActiveSupport::TestCase` / `ActionDispatch::IntegrationTest`)

## Acceptance criteria

- `Actions` and `Invocation` convert together, with `Actions#_shared_configuration`'s `super` inlined into its includers under `@inlinedFrom`, or written as `rbCallSuper` if the includers are an open set.
- The `test-help.ts` reopenings define `before_setup` on the reopened classes without a carrier (Ruby's `class ... def before_setup; super; end` is a class reopening, not a module).
- `git grep -nE 'new Module\(|\.superMethod\(|\bModule\b.*from "@blazetrails/ruby-compat' -- packages/trailties/src ':!*.test.ts'` is empty.
