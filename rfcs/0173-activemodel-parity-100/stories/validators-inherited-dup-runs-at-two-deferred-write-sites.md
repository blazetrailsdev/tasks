---
title: "activemodel: Validations.inherited's _validators dup runs at two deferred write sites"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8473
claim: "2026-10-04T01:59:42Z"
assignee: "validators-inherited-dup-runs-at-two-deferred-write-sites"
blocked-by: null
closed-reason: null
---

## Context

Rails copies `_validators` when a class is defined: `Validations::ClassMethods#inherited`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:287-291`) does
`dup = _validators.dup; base._validators = dup.each { |k, v| dup[k] = v.dup }`. JS has no `inherited`
hook, so trails runs that body at the first write, in two places: `ClassMethods.validatesWith`
(`packages/activemodel/src/validations/with.ts`) and `ClassMethods.clearValidatorsBang`
(`packages/activemodel/src/validations.ts`), each behind
`hasOwnProperty(this, "__class_attr__validators")` (trails PR 8460). CLAUDE.md's
"`inherited` is deferred to own-property memo guards" section covers `ModelSchema` only.

Observable gaps against Rails, until a subclass first writes:

- `Parent.validatesWith(…)` after `class Child extends Parent` is visible on `Child`
  (pinned by `validations.trails.test.ts`, "inheritance is copy-on-first-write …").
- `Child.validatorsOn("x")` on a miss runs the default proc against the parent's hash and stores the
  empty bucket in the PARENT's `_validators` (`validations.rb:266-270` stores in the child's).

## Acceptance criteria

- [ ] `inherited`'s body for `_validators` lives at one site, not two.
- [ ] A subclass does not observe a parent's `_validators` writes made after the subclass is
      defined, or the remaining gap is ratified in CLAUDE.md with the alternatives tried.
- [ ] A `validatorsOn` miss on a subclass stores nothing in the parent's hash.
