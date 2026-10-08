---
title: "activejob: Core#initialize is inlined into Base's constructor"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activejob"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0186 § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

Rails definitions in scope:

- `ActiveJob::Core#initialize` (`vendor/rails/v8.0.2/activejob/lib/active_job/core.rb:93`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

RFC 0169 (`activejob-package-port`) and RFC 0185 (`ruby-ts-codegen`, piloted on activejob) both touch this package. If `core.rb` is not ported when this is picked up, fold the rule into that port and close this story against it.

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries the `@inlinedFrom` tags in chain order, and no `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
