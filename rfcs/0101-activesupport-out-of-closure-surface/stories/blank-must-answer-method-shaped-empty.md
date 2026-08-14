---
title: "Object#blank? must answer for a method-shaped empty?"
status: done
updated: 2026-08-14
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6506
claim: "2026-08-14T01:57:12Z"
assignee: "converged-row-stale-mark-forces-whole-tree-reseed"
blocked-by: null
closed-reason: null
---

# `Object#blank?` must answer for a method-shaped `empty?`

## Context

`packages/activesupport/src/core-ext/object/blank.ts#isBlank` ports
`Object#blank?` (`vendor/rails/activesupport/lib/active_support/core_ext/object/blank.rb:18-20`):

```ruby
def blank?
  respond_to?(:empty?) ? !!empty? : false
end
```

PR #6499 implements the `respond_to?(:empty?)` probe for `Set`/`Map` and for a
**boolean-valued** `isEmpty` / `empty` reader, but deliberately does NOT invoke a
method-shaped `isEmpty()`, because trails has async ones — `Relation#isEmpty`
issues a query — and Ruby's `blank?` does no I/O. So a ported object that spells
`empty?` as a method (the conventions-table spelling) is currently answered by
the `Object.keys` fallback instead of by its own `empty?`, which is a silent
divergence from blank.rb:19 for exactly the receivers Ruby's probe is for.

## Converged shape

Either make the sync/async split explicit so a synchronous `isEmpty()` is
invoked as Ruby invokes `empty?` (leaving the async ones out by construction
rather than by shape), or converge `Relation#isEmpty` and friends so the name
carries Ruby's synchronous meaning. Then drop the "boolean-valued reader only"
carve-out and its call-site note.

## Acceptance criteria

- [ ] A ported object exposing a synchronous `isEmpty()` is answered by that
      method, matching blank.rb:19.
- [ ] No async method is invoked from `blank?` (Ruby's issues no I/O).
- [ ] The carve-out note in `blank.ts`'s `isBlank` JSDoc is deleted.
