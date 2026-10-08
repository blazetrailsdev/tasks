---
title: "trailties: the five Rails generator and command module initialize bodies are inlined"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["trailties"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

Rails definitions in scope:

- `Rails::ActionMethods#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:10`)
- `Rails::Command::EnvironmentArgument#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/command/environment_argument.rb:16`)
- `Rails::Generators::Actions#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb:10`)
- `Rails::Generators::ModelHelpers#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/generators/model_helpers.rb:26`)
- `Rails::Generators::ResourceHelpers#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/generators/resource_helpers.rb:17`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

trails site: `generators/named-base.ts:39` calls `initializeIncludedModules(this, [], this.options, …)`. `EnvironmentArgument` is unported as of 2026-10-08 (`trailties-dbconsole-command-has-no-consumer` needs it).

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries an `@inlinedFrom` tag, in chain order, for every segment whose Rails `def` is in a different Ruby file from the one the constructor's file mirrors; a same-file segment is inlined untagged. No `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
