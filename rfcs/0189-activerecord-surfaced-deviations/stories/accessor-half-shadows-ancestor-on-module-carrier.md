---
title: "accessor-half-shadows-ancestor-on-module-carrier"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: [ruby-compat, activesupport, activejob]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby keeps a reader `x` and a writer `x=` as separate method entries, so `mattr_writer :default_url_options` on a plain module (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:97-105`) gives the module only `default_url_options=`. An includer still resolves the reader further up the ancestry. ActionView's railtie includes UrlFor into `RoutingUrlFor`, so `RoutingUrlFor` takes this arm. A test class then includes `RoutingUrlFor` above a parent that holds the `class_attribute :default_url_options` reader (`actionview/test/activerecord/polymorphic_routes_test.rb`).

A JS property holds both halves. trails' `mattrWriter` (`packages/activesupport/src/module-ext.ts`) therefore cannot seat a writer-only instance half on a ruby-compat `Module` carrier without hiding the ancestor's reader. On trails#8987 the 40 `PolymorphicPathRoutesTest` cases failed with `Object.keys(undefined)` at `action-dispatch/routing/url-for.ts:109`. `mattrWriter` now skips the Module instance half when the carrier has no reader half, carrying `@inventedArm if — CONVERGEABLE` pointing at this story. ruby-compat's `rbModAttrWriter` has the same shape.

A filler half that reads or writes through to the next object in the chain fixes dispatch. But `checkDefinitionVisibility` (`packages/ruby-compat/src/object.ts:706-728`) and the super lookup in `include.ts` (~:660) would then see the filler, and `respond_to?(:x=)` would wrongly answer true (`attribute_accessor_test.rb` `test_should_not_create_instance_writer`).

The same split happens in the other direction across two included modules.
`ActiveJob::QueuePriority` defines the reader `def priority` (it `instance_exec`s a
stored Proc, `vendor/rails/v8.0.2/activejob/lib/active_job/queue_priority.rb:53-59`) and
`ActiveJob::Core` defines the writer `attr_writer :priority`
(`vendor/rails/v8.0.2/activejob/lib/active_job/core.rb:25`); `Base` includes both.
ruby-compat's `include` gives each module its own link in the prototype chain
(`Module#appendFeatures`, `packages/ruby-compat/src/include.ts`:
`Object.defineProperties(link, Object.getOwnPropertyDescriptors(carrierOf(this)))`),
and JS stops at the first link that has `priority`. With the reader as a getter on
`QueuePriority`'s link, `job.priority = 123` (`set(priority: 123)`) throws on a
getter-only property; with the reader as a method, the assignment creates an own
field that hides it. Surfaced by the activejob codegen trial (spike
`spike-ar-ruby-ir-ts-29583a`, `scripts/codegen/PROGRESS.md` steps 25-26): the
generated `queue_priority_test.rb` "is assigned when perform_now / perform_later"
fail on `job.priority is not a function`.

## Acceptance criteria

- [ ] ruby-compat can represent an accessor property with one half absent, and that half defers to the next object in the prototype chain for get/set.
- [ ] `method_defined?` / `respond_to?` / `rbFSend` / super lookup treat the absent half as undefined there and keep walking.
- [ ] `mattrWriter` on a Module seats its instance writer unconditionally, and the `@inventedArm if` receipt is removed.
- [ ] A reader in one included module and a writer in another both answer on the
      includer: a unit test with two `new Module()`s, one defining a getter `x` and
      one an `attrWriter("x")`, included into a class in either order; `obj.x = v`
      reaches the writer and `obj.x` the reader.
- [ ] `PolymorphicPathRoutesTest` and `ModuleAttributeAccessorTest` stay green.
