---
title: "parity: an @inlinedFrom with no module initialize, or an includer with no tag, is red"
status: draft
updated: 2026-10-08
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: tooling
packages: ["scripts"]
deps:
  [
    "extractor-reads-inlined-from-tags-on-constructors",
    "parity-api-credits-module-initialize-through-inlined-from",
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

`rails-api.json` records each class's `includes` and each module's instance methods, so both directions are computable: a tag naming a module that defines no `initialize`, and a class whose Rails counterpart includes or prepends a module with an `initialize` but whose TS constructor has no tag for it. 38 modules define one (this RFC § Baseline).

## Acceptance criteria

- A tag naming a module with no `initialize`, or a module the Rails class does not include or prepend, fails the gate.
- The missing-tag direction is enrolled per package through an only-grow set, empty at merge.
- The gate runs in the `rails-comparison` CI job and has a `pnpm` script named under `parity:api:`.
- CLAUDE.md § "Before you open the PR" gains the gate in the step that covers ported method bodies.
- A tag whose citation differs from the `def` span `rails-api.json` gives for that module at the active vendored version is red, and a `--fix` mode rewrites it.
- `pnpm vendor:recite` and `scripts/vendor-citations.test.ts` learn the tag: they prepend `vendor/` to its path to resolve it, rewrite a stale version in place without adding the prefix, and a test covers a `ref` bump.
- The missing-tag direction fires only for a `def` in a different Ruby file from the one the constructor's file mirrors; a same-file body needs no tag and a tag on one is red.
- The missing-tag direction also covers a class that `extend`s a `ClassMethods` module defining `new` (`Inheritance::ClassMethods#new`, `Deduplicable::ClassMethods#new`), under the same different-file rule; an `ActionView::TestCase::Behavior::ClassMethods#new` inlined untagged in the same file is not red.
