---
title: "activemodel: API, Attributes and SerializeCastValue initialize are inlined into their includers' constructors"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activemodel"]
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

RFC 0186 § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

Rails definitions in scope:

- `ActiveModel::API#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:80`)
- `ActiveModel::Attributes#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attributes.rb:106`)
- `ActiveModel::Type::SerializeCastValue#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/serialize_cast_value.rb:41`)

How each is ported today has not been read: it may run through `initializeIncludedModules`, be an exported `initialize` function a constructor calls, already be inlined by hand, or sit in an unported file. Start by reading each site and its includers.

trails sites: `packages/activemodel/src/api.ts:21-27` (the exported `initialize` and its `defineMethod`), `attributes.ts:71`, `type/value.ts:46`, and `Model`'s constructor at `model.ts:122`, which carries `@missingRailsCall assign_attributes — CONVERGEABLE activemodel-api-initialize-concern-constructor`.

## Acceptance criteria

- Each listed `initialize` body is inlined into the constructor of every class that includes or prepends its module, at Ruby's `super` position, line for line.
- Each such constructor carries the `@inlinedFrom` tags in chain order, and no `initialize` function or `defineMethod("initialize", …)` remains for these modules.
- A module in an unported file is left alone and named in the PR body.
- The package is enrolled in the missing-tag arm of the staleness gate in this PR.
- Where one module's body lands in more than one constructor, the PR body states how many.
- `Model`'s constructor is `API#initialize`'s body, and the `@missingRailsCall assign_attributes` receipt is deleted.
- The `api.rb` `initialize` entry in `SCOPED_SKIP_GROUPS` is deleted.
- `activemodel-api-initialize-concern-constructor` (RFC 0123) is closed by this PR.
