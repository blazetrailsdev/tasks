---
title: "delegate-class-must-not-construct-the-delegated-superclass"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `DelegateClass(superclass)` builds `Class.new(Delegator)`
(`vendor/ruby/lib/delegate.rb:394-395`) and reaches `superclass`'s API only through the forwarders it
generates (`:397-419`). It therefore **never runs `superclass#initialize`**: `Delegator#initialize`
is `__setobj__(obj)` and nothing else (`:75-77`). Any class at all can be delegated, whatever its
constructor requires.

trails' `DelegateClass` (`packages/ruby-compat/src/delegate.ts`) returns
`class extends superclass` instead, because TypeScript has no structural stand-in for Ruby's duck
typing — callers narrow with `instanceof`, so a delegator that is not an instance of what it
delegates to is unusable as one. JS then requires `super()` before `this` in a derived constructor,
so `superclass`'s constructor DOES run, on a wrapper that forwards every read anyway.

Consequences, both currently latent:

- `super()` is called with no arguments, so a `superclass` with a required constructor parameter
  throws (or narrows to `undefined` inside its body).
- A `superclass` constructor with side effects runs them once per delegator.

Neither bites the only call site today: `Serialized extends DelegateClass(ValueType)`
(`activerecord/lib/active_record/type/serialized.rb:5`), and `ActiveModel::Type::Value#initialize`
(`activemodel/lib/active_model/type/value.rb:17`) takes only optional kwargs and assigns three
ivars. Surfaced by review on trails#7728, where the port landed.

## Acceptance criteria

- `DelegateClass` accepts the same class set Ruby does: constructing the returned class does not
  invoke `superclass`'s constructor, matching `delegate.rb:75-77,394-395`.
- The `instanceof` narrowing the `extends` was chosen for is preserved — `Serialized` must stay an
  instance of `ValueType`, since `attribute-registration.ts` and `attributes.ts` narrow on it.
  `Object.create(superclass.prototype)`-style construction, or a `Reflect.construct` /
  `[Symbol.hasInstance]` arrangement, are the shapes to try; the `extends` deviation note in
  `delegate.ts`'s receipt records why the naive alternative was rejected.
- The paragraph in `delegate.ts` pointing at this story is removed.
