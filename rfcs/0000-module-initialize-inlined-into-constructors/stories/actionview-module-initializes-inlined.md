---
title: "actionview: the five ActionView module initialize bodies are inlined"
status: draft
updated: 2026-10-08
rfc: "0000-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["actionview"]
deps:
  [
    "parity-api-credits-module-initialize-through-inlined-from",
    "call-gate-compares-a-tagged-constructor-against-the-inlined-bodies",
    "inlined-from-staleness-gate-both-directions",
  ]
deps-rfc: []
est-loc: 350
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

- `ActionView::AbstractRenderer::ObjectRendering#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/abstract_renderer.rb:37`)
- `ActionView::Helpers::Tags::CollectionHelpers#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/collection_helpers.rb:30`)
- `ActionView::Helpers::Tags::Placeholderable#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/placeholderable.rb:7`)
- `ActionView::Layouts#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:361`)
- `ActionView::Rendering#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:32`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

trails sites: `actionview/src/base.ts:237` and `helpers/tags/base.ts:64` call `initializeIncludedModules`. `Layouts` and `Rendering` are included into controllers, so their bodies land in actionpack constructors; coordinate with `actioncontroller-module-initializes-inlined` on which PR touches `Metal`'s subclasses.

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries an `@inlinedFrom` tag, in chain order, for every segment whose Rails `def` is in a different Ruby file from the one the constructor's file mirrors; a same-file segment is inlined untagged. No `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
