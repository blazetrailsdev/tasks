---
title: "validators-inherited-snapshot-is-copy-on-first-write"
status: blocked
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-03T16:07:12Z"
assignee: "lazy-attribute-hash-default-value-and-equality"
blocked-by: "No class-definition hook in JS: Validations::ClassMethods#inherited (activemodel/lib/active_model/validations.rb:287-291) snapshots the parent's _validators when the subclass is DEFINED. Evaluating 'class Child extends Parent' runs no code on Parent (only a Proxy 'prototype' get trap could observe it, and classes are not Proxies), and the parent keeps no list of subclasses to snapshot into at its own later write, so the snapshot moment is unrecoverable. The copy-on-write in validations/with.ts already keeps child writes out of the parent; only the timing of a parent write made after the subclass is defined and before the subclass's first own write differs. Converging needs an invented registration step (decorator / explicit register call) on every model, which CLAUDE.md § 'inherited is deferred to own-property memo guards' rejects."
closed-reason: null
---

## Context

`ActiveModel::Validations::ClassMethods#inherited`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:287-291`) copies the parent's
validators into the subclass when the subclass is DEFINED:

```ruby
def inherited(base) # :nodoc:
  dup = _validators.dup
  base._validators = dup.each { |k, v| dup[k] = v.dup }
  super
end
```

JS has no hook that fires when `class Child extends Parent` is evaluated, so trails carries the
hook as copy-on-write: `validatesWith` builds a new `Map` with new buckets and assigns it to
`this._validators` (`packages/activemodel/src/validations/with.ts:76-86`), and `_validators` is a
`classAttribute` whose reads walk the constructor chain (`packages/activemodel/src/validations.ts:77`).
A subclass's writes therefore never reach its parent, which is the effect the hook protects.

The residue is the snapshot moment. In Rails a validator the PARENT gains after the subclass is
defined is absent from `Child.validators` / `Child.validators_on`. In trails a subclass that has
not yet written its own `_validators` still reads the parent's map, so it lists that validator
until its own first write, and stops listing later ones after it.
`packages/activemodel/src/validations.trails.test.ts:821-842` ("inheritance is copy-on-first-write")
pins the trails behaviour.

Found by `activemodel-lifecycle-hook-semantics-audit`.

## Acceptance criteria

- [ ] `Child.validators` / `Child.validatorsOn` do not list a validator the parent gained after
      `Child` was defined, with a test mirroring `validations.rb:287-291`; or the story is blocked
      with the specific blocker (no class-definition hook in JS) recorded.
- [ ] The `copy-on-first-write` trails test is rewritten to the Rails behaviour if it converges.
