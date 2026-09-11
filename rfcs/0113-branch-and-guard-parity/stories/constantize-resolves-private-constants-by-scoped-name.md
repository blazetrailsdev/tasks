---
title: "constantize-resolves-private-constants-by-scoped-name"
status: done
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 56
pr: trails#7718
claim: "2026-09-11T19:24:57Z"
assignee: "scope-keeps-a-scopes-map-beside-the-singleton-method"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `middle_options` (story
`habtm-middle-options-adds-an-else-arm-and-two-keys-rails-lacks`). Rails'
`middle_options` sets no `:anonymous_class`
(`activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:71-78`);
the join model is found by `class_name` `"#{lhs_model.name}::#{join_model.name}"`,
which `has_and_belongs_to_many` makes resolvable with `const_set` +
`private_constant` (`associations.rb:1877-1878`) and `compute_class` reaches via
`active_record.send(:compute_type, name)` (`reflection.rb:496`,
`inheritance.rb:242-264`, `candidate.safe_constantize`).

MRI resolves a private constant through a scoped string:

```sh
ruby -e 'class A; B=1; private_constant :B; end; p Object.const_get("A::B")'   # => 1
"A::B".safe_constantize                                                        # => 1
```

trails' `constantize` / `safeConstantize` (`@blazetrails/activesupport`) instead
raise `private constant Developer::HABTM_SharedComputers referenced`, so
`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts`
`middleOptions` still sets `middleOptions.anonymousClass = joinModel` to bypass
class-name resolution. Removing it reds `persistence.test.ts` via
`FixtureError: table "developers" has no columns named "sharedComputers"`.

## Acceptance criteria

- [ ] `constantize` / `safeConstantize` resolve a `privateConstant`-marked
      constant through a scoped `"A::B"` string, matching MRI `const_get`.
- [ ] `middleOptions` no longer sets `anonymousClass`; it is line-for-line
      `has_and_belongs_to_many.rb:71-78`.
- [ ] `persistence.test.ts`, fixtures and habtm suites green on all three lanes.
