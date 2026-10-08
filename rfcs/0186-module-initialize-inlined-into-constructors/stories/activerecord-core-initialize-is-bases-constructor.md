---
title: "activerecord: Core#initialize is Base's constructor, with API#initialize inlined at its super"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activerecord"]
deps: ["activerecord-base-includes-activemodel-api-instead-of-extending-model"]
deps-rfc: []
est-loc: 400
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

- `ActiveRecord::Core#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

trails sites: `packages/activerecord/src/core.ts:765` (the exported `constructor` function, with an allocation arm receipted `@inventedArm if — PERMANENT`) and `core.ts:826` (`defineMethod("initialize", constructor)`). `Base`'s constructor also holds the body of `Inheritance::ClassMethods#new` (CLAUDE.md § "A record is built with `new Klass` only"); that stays.

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries an `@inlinedFrom` tag, in chain order, for every segment whose Rails `def` is in a different Ruby file from the one the constructor's file mirrors; a same-file segment is inlined untagged. No `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
- `Base`'s constructor reads top to bottom as `Inheritance::ClassMethods#new`, then `Core#initialize` with `API#initialize`'s line at the `super` position, tagged in that order.
- `record-init-internals-never-reaches-activemodel-validations` is re-checked and closed or re-pointed.
