---
title: "actionpack: Instrumentation, RequestForgeryProtection and UrlFor initialize are inlined into Metal's subclasses"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["actionpack"]
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

- `ActionController::Instrumentation#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/instrumentation.rb:23`)
- `ActionController::RequestForgeryProtection#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:366`)
- `ActionController::UrlFor#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/url_for.rb:32`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

trails site: `action-controller/metal.ts:144` calls `initializeIncludedModules`. `Metal#initialize` is `metal.rb:210-217`. `Base` and `API` include different module lists, so the two constructors inline different chains.

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries an `@inlinedFrom` tag, in chain order, for every segment whose Rails `def` is in a different Ruby file from the one the constructor's file mirrors; a same-file segment is inlined untagged. No `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
