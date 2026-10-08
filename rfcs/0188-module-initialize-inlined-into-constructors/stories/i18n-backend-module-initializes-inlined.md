---
title: "i18n: Chain::Implementation, KeyValue::Implementation and MissingTranslation::Base initialize are inlined"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["i18n"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 200
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

- `I18n::Backend::Chain::Implementation#initialize` (`vendor/i18n/v1.14.8/lib/i18n/backend/chain.rb:27`)
- `I18n::Backend::KeyValue::Implementation#initialize` (`vendor/i18n/v1.14.8/lib/i18n/backend/key_value.rb:75`)
- `I18n::MissingTranslation::Base#initialize` (`vendor/i18n/v1.14.8/lib/i18n/exceptions.rb:52`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

These cite the vendored i18n gem.

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries an `@inlinedFrom` tag, in chain order, for every segment whose Rails `def` is in a different Ruby file from the one the constructor's file mirrors; a same-file segment is inlined untagged. No `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
