---
title: "activemodel-respond-to-cannot-hide-private-methods"
status: blocked
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-23T14:33:22Z"
assignee: "activemodel-respond-to-cannot-hide-private-methods"
blocked-by: "blocked on ruby-compat-runtime-method-visibility-carrier (no runtime visibility fact for basicObjRespondTo's pub)"
closed-reason: null
---

## Context

Parked test: `packages/activemodel/src/attribute-methods.test.ts` — "should not interfere with respond_to? if the attribute has a private/protected method" (it.skip, converged body intact).

Rails: `vendor/rails/activemodel/test/cases/attribute_methods_test.rb:315-327` asserts `assert_not_respond_to m, :private_method` on `ModelWithAttributes2`, whose `private_method` is a `private def`. Rails' `ActiveModel::AttributeMethods#respond_to?` (`activemodel/lib/active_model/attribute_methods.rb:528-533`) answers false through `super` with `include_private_methods = false`, because `basic_obj_respond_to` (`vendor/ruby/vm_method.c:2864-2879`) excludes private methods when `pub` is set.

trails: `InstanceMethods.respondTo` (`packages/activemodel/src/attribute-methods.ts`) delegates to `basicObjRespondTo` (`packages/ruby-compat/src/object.ts`), whose `pub` is `void pub;`. A TS `private` method is an ordinary runtime property, so `respondTo("private_method")` answers true. CLAUDE.md § "Method visibility is not a runtime fact in JS" ratifies that `basicObjRespondTo` cannot see visibility.

The other three assertions in the test pass today; only the `assert_not_respond_to` fails.

## Acceptance criteria

- [ ] Either a runtime visibility carrier exists that `basicObjRespondTo` honours for `pub`, un-parking the test, or the story is closed with the test converted to a `PERMANENT-SKIP` per the ratified section — decided by the RFC owner.
