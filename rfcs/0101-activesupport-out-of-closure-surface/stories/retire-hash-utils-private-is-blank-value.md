---
title: "hash-utils keeps a private _isBlankValue beside the ported Object#blank?"
status: done
updated: 2026-08-15
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6570
claim: "2026-08-15T17:15:05Z"
assignee: "converge-with-query-connection-onto-with-connection"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/hash-utils.ts` carries a private `_isBlankValue`
that reimplements `Object#blank?` (`core_ext/object/blank.rb:18-20`):

```ts
function _isBlankValue(value: unknown): boolean { ... }
```

`isBlank` — the real port of `blank?` — already lives at
`packages/activesupport/src/core-ext/object/blank.ts:144`, put there by
[[port-object-blank-to-core-ext-and-retire-private-copies]]. That story retired
the private copies it knew about; this one survived.

PR #6556 made the inconsistency visible: `Array#compact_blank!`
(`core-ext/array/access.ts`) calls the real `isBlank`, while `Hash#compact_blank`
and `Hash#compact_blank!` (`hash-utils.ts`) call `_isBlankValue` — the same
Rails predicate, `blank?`, resolved two ways in one PR. Rails has one
`blank?` and both bodies call it (`core_ext/enumerable.rb:222-224`, :232-235,
:263-266).

The two are close but not identical: `_isBlankValue` treats any object with no
own enumerable keys as blank, where `Object#blank?` is `respond_to?(:empty?) ?
!!empty? : !self` — a plain object with no `empty?` is NOT blank in Ruby.

## Converged shape

Delete `_isBlankValue` and route `compactBlank` / `compactBlankBang` through
`isBlank` from `core-ext/object/blank.js`, so every `blank?` call site in the
package resolves to the one port. Check the behavioural difference above before
swapping — some caller may be relying on the private copy's object arm, and if
so the correct fix is that caller, not a second predicate.

Sweep for further private copies while you are in here; the parent story's
retirement half is evidently incomplete.

## Acceptance criteria

- [ ] No `_isBlankValue` in `hash-utils.ts`; `compact_blank`/`compact_blank!`
      call the ported `isBlank`.
- [ ] Any behaviour change from the object arm is identified and either matches
      Ruby's `blank?` or is fixed at the caller.
- [ ] No other private `blank?` reimplementation remains in activesupport.
