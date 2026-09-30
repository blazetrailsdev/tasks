---
title: "respond-to-answers-object-to-yaml"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Psych defines `to_yaml` on `Object` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/core_ext.rb:12-14`),
so every Ruby object answers `respond_to?(:to_yaml)`. Rails' `DelegationTests` asserts exactly
that for `post.comments`, `Comment.all` and `Comment.all.records`
(`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb:10-24`, `ARRAY_DELEGATES`
includes `:to_yaml`).

`psych-object-to-yaml` ports `Object#to_yaml` as a free `toYaml(o, options)` in
`ruby-compat/src/psych/core-ext.ts`, the way trails ports Object-level methods. No object carries a `toYaml` member,
so `rbObjRespondTo` / `basicObjRespondTo` (`packages/ruby-compat/src/object.ts:142`) and
`assertRespondTo` (`packages/activesupport/src/testing/assertions.ts:411,440-460`) still answer
`false` for `to_yaml` once it lands. The only such Object-level name `basicObjRespondTo` special-cases today is
`isEmpty` (`object.ts:144-153`).

Parked tests (`// BLOCKED:` naming this story):
`packages/activerecord/src/relation/delegation.test.ts` `DelegationRelationTest` and
`DelegationAssociationTest` > `delegates to yaml to Array`.

## Acceptance criteria

- `basicObjRespondTo(obj, "toYaml")` answers `true` for every non-`BasicObject` receiver once
  `toYaml` is exported, in the same way it answers Kernel methods found before `respond_to_missing?`.
- Both parked `delegates to yaml to Array` tests run unskipped with Rails' `assert_respond_to`.
