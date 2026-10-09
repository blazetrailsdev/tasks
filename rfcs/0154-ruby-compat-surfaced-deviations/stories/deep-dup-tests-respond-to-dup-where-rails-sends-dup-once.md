---
title: "deepDup tests respond_to?(:dup) where Object#deep_dup sends dup once"
status: draft
updated: 2026-10-09
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

Touched on trails#8712 when a String began answering `respond_to?(:dup)`. Rails' `Object#deep_dup`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/deep_dup.rb:15-17`) is
`duplicable? ? dup : self`. The fallback arm of `deepDup` (`packages/activesupport/src/hash-utils.ts`) is

```ts
if (isDuplicable(obj)) {
  return rbObjRespondTo(obj, "dup") ? (rbFSend(obj, "dup") as T) : rbObjDup(obj);
}
return obj;
```

The inner `rbObjRespondTo(obj, "dup") ? … : rbObjDup(obj)` ternary is an arm Rails does not have: Ruby's
`dup` is one send, which reaches an overriding `dup` or `Object#dup` (`rb_obj_dup`) by method lookup. The same
shape sits in the `Hash` arm above it (`rbObjRespondTo(obj, "dup") ? obj.dup() : dup(obj)`, Rails
`deep_dup.rb:43-44` `hash = dup`). `rbFSend(obj, "dup")` should dispatch both cases itself, falling back to
`rbObjDup` when the receiver defines no `dup`.

## Acceptance criteria

- [ ] `rbFSend(recv, "dup")` answers `rbObjDup(recv)` for a receiver with no `dup` member (MRI `rb_obj_dup`,
      `vendor/ruby/v3.3.11/object.c`), with a ruby-compat test.
- [ ] `deepDup`'s fallback arm is `isDuplicable(obj) ? rbFSend(obj, "dup") : obj` and its Hash arm sends `dup`
      once, with no `rbObjRespondTo(obj, "dup")` test left in `hash-utils.ts`.
- [ ] `core-ext/object/deep-dup.test.ts` and `activemodel/src/error.trails.test.ts` pass.
