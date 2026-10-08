---
title: "docs: CLAUDE.md records the constructor rule, the hoisted super and @inlinedFrom"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: docs
packages: ["scripts"]
deps: ["lint-inlined-from-only-on-constructors-naming-initialize"]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

CLAUDE.md § "Module mixins" covers methods and the `included` / `extended` hooks but says nothing about `initialize`. `ruby-compat/src/include.ts:757-771` documents the chain walker this RFC retires. Owner ruling, 2026-10-08: "no initialize methods, constructor inheritance has to get inlined".

## Acceptance criteria

- A section states both rules from this RFC § Design: JS `super()` for class-to-class, hoisted when the bodies are independent; inlining for a module or a dependent parent.
- It states that a parent constructor never calls an overridable hook, with the class-field reason.
- It defines `@inlinedFrom`: where it goes, its one valid value shape, and that it is not a licence for arel's `inlined-from` bucket.
- It cites `api.rb:80-84`, `core.rb:471-477` and `base.rb:283` as the worked example.
- It states that the tag's citation is derived and autofixed, never hand-edited, and that body pins, not the citation, detect a changed Rails body.
- It states that the tag follows the file: only a body from another Ruby file is tagged.
