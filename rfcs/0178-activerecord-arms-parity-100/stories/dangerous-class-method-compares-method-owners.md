---
title: "activerecord: dangerous-class-method-compares-method-owners"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8718
claim: "2026-10-09T17:09:43Z"
assignee: "active-record-base-inherited-chain-needs-one-deferred-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`dangerous_class_method?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:201-213`)
is `Base.respond_to?(method_name, true)`, then `Object.respond_to?(method_name, true)`, then
`Base.method(method_name).owner != Object.method(method_name).owner`.
`packages/activerecord/src/attribute-methods.ts` `isDangerousClassMethod` instead walks the
constructor chain from `ActiveRecord.Base` with a `while` loop and an own-property test, and
excludes `length` / `name` / `prototype` through `INTRINSIC_FUNCTION_PROPS`. ruby-compat's
`rbObjMethod` (`packages/ruby-compat/src/method.ts:106`) returns a `Method` with no `owner`.
Reported as `attribute-methods.ts#isDangerousClassMethod +loop`; carries `@inventedArm loop`.

## Acceptance criteria

- [ ] `Method#owner` exists in ruby-compat.
- [ ] `isDangerousClassMethod` has Rails' three arms over `rbObjRespondTo` and `rbObjMethod(...).owner`, with no loop.
- [ ] The `@inventedArm loop` receipt is deleted and the invented report shows no row.
