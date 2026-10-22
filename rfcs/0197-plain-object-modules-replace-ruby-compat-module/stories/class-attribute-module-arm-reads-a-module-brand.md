---
title: "ClassAttribute.redefine's is_a?(Module) arm reads defineModule's moduleVisibility stamp, not a module test"
status: ready
updated: 2026-10-22
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::ClassAttribute.redefine` (`vendor/rails/v8.0.2/activesupport/lib/active_support/class_attribute.rb:6-13`) takes the private-namespaced-reader arm when `owner.singleton_class? && owner.attached_object.is_a?(Module)`. trails#9183 made `packages/activesupport/src/class-attribute.ts` `ClassAttribute.redefine` answer that `is_a?(Module)` as `attachedObject instanceof Module || Object.hasOwn(attachedObject, moduleVisibility)`, so `ActiveJob::Callbacks` (`packages/activejob/src/callbacks.ts`, built with `defineModule({})`) can run its singleton `:execute` chain (`activejob/lib/active_job/callbacks.rb:22-25`).

Two debts: the `instanceof Module` arm survives only while ruby-compat `Module` does (RFC 0197 retires it), and the `moduleVisibility` stamp is `defineModule`'s visibility table read as a module brand, so a plain-object module not built by `defineModule` falls to the non-module (Hash) arm. `packages/activesupport/src/callbacks.trails.test.ts:1253` pins a bare `{}` to that arm.

## Acceptance criteria

- [ ] One ruby-compat answer to Ruby's `obj.is_a?(Module)` for a plain-object module (the `defineModule` brand, or `rbObjIsKindOf` against a Module seat), named for what it asks; `ClassAttribute.redefine` calls it in place of the inline `instanceof Module || Object.hasOwn(…, moduleVisibility)` test.
- [ ] Once activesupport's `Callbacks` is a plain object (`activesupport-callbacks-is-a-plain-object-not-a-concern-module`), the `instanceof Module` arm is removed.
- [ ] The `{}`-is-a-Hash test and both module singleton-class `:execute` tests in `callbacks.trails.test.ts` still pass.
