---
title: "activerecord: EncryptedFixtures, Type::Internal::Timezone and ControllerRuntime initialize are inlined"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activerecord"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 250
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

- `ActiveRecord::Encryption::EncryptedFixtures#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encrypted_fixtures.rb:6`)
- `ActiveRecord::Type::Internal::Timezone#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/internal/timezone.rb:7`)
- `ActiveRecord::Railties::ControllerRuntime#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/controller_runtime.rb:26`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

`EncryptedFixtures` is prepended onto `Fixture` (`fixtures.rb:817-820`), so its body runs before the class's own. `Timezone` is included into several type classes; `ruby-compat/src/include.ts:766-771` describes how its `initialize` is spliced today. `normalization.ts:100` is a chain-walker call site in this package whose module is not in the list above; read it and say which Rails `initialize` it serves.

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries an `@inlinedFrom` tag, in chain order, for every segment whose Rails `def` is in a different Ruby file from the one the constructor's file mirrors; a same-file segment is inlined untagged. No `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
- The `fixtures.rb` / `encrypted_fixtures.rb` `initialize` entry in `SCOPED_SKIP_GROUPS` is deleted.
- `activerecord-fixture-initialize-prepend-constructor` (RFC 0123) is closed by this PR.
