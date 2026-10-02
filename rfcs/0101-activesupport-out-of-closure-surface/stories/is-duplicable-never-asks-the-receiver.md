---
title: "isDuplicable is a type check, not the duplicable? send, so a Singleton includer is dup'd"
status: draft
updated: 2026-10-02
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Read while giving `deepDup` Ruby's `Object#deep_dup` arm in trails PR 8411.

`Object#deep_dup` is `duplicable? ? dup : self`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/deep_dup.rb:15-17`), and
`duplicable?` is a method any class may override. Rails does so for `Singleton`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/duplicable.rb`, the
`module Singleton; def duplicable?; false; end` block at the end of the file), and
`Attribute#initialize_dup` asks it of the cast value
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:155-159`).

`isDuplicable(value)` (`packages/activesupport/src/core-ext/object/duplicable.ts`) is a plain
function over built-in type checks. It never asks the receiver, so an object whose class answers
`duplicable?` false (a `Singleton` includer) is reported duplicable and `deepDup` dups it. The
same file exports `Method`, `UnboundMethod` and `Singleton` stand-ins whose `isDuplicable` is a
static returning false, which no caller reaches through an instance.

## Converged shape

`isDuplicable(value)` is the `duplicable?` send: it dispatches to the receiver's own
`isDuplicable()` when it defines one (found with `rbObjRespondTo`, not a property read) and
otherwise answers `Object#duplicable?`'s `true`. The `Singleton` stand-in is an includable module
whose instance method answers false.

## Acceptance criteria

- [ ] `deepDup(obj)` returns `obj` itself for an object whose class defines `isDuplicable()`
      returning false.
- [ ] `duplicable.test.ts` and `deep-dup.test.ts` stay green; a `.trails.test.ts` case covers the
      dispatch.
