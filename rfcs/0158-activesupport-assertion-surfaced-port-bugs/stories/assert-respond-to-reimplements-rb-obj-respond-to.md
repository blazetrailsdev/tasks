---
title: "assertRespondTo uses a private respondsTo instead of rbObjRespondTo"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Surfaced by trails#8080. Minitest's `assert_respond_to` / `refute_respond_to` (`vendor/minitest/lib/minitest/assertions.rb:453-458,803-807`) are `obj.respond_to?(meth, include_all)`. That is `rb_obj_respond_to`, which ruby-compat already ports as `rbObjRespondTo` / `basicObjRespondTo` (`packages/ruby-compat/src/object.ts`).

`packages/activesupport/src/testing/assertions.ts` instead calls a private `respondsTo(object, name, includeAll)` that reimplements the same lookup with extra arms Ruby's `respond_to?` does not have:

- a `String.prototype` arm that goes to `rbStrRespondTo`;
- an arm that rejects a setter-only accessor;
- an `name=` arm that finds a setter by its bare name.

Two separate implementations of `respond_to?` can disagree. The String and setter arms belong in ruby-compat's `basicObjRespondTo` if they are `method_boundp` facts (String's method table is its class's method table), not in an assertion helper.

## Converged shape

Fold the String method-table arm and the accessor arms into `basicObjRespondTo` (`vm_method.c:2864`) where each is a real `method_boundp` answer. Then have `assertRespondTo` / `assertNotRespondTo` call `rbObjRespondTo(obj, meth, includeAll)` directly and delete `respondsTo` / `findDescriptor`.

## Acceptance criteria

- [ ] `testing/assertions.ts` has no private `respondsTo`; both helpers call `rbObjRespondTo`.
- [ ] Every `assertRespondTo` / `assertNotRespondTo` / `assertEmpty` call site across the packages still passes.
