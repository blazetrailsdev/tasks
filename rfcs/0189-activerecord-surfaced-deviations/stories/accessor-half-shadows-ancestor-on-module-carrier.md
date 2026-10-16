---
title: "accessor-half-shadows-ancestor-on-module-carrier"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
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

Ruby keeps a reader `x` and a writer `x=` as separate method entries, so `mattr_writer :default_url_options` on a plain module (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:97-105`) gives the module only `default_url_options=`. An includer still resolves the reader further up the ancestry. ActionView's railtie includes UrlFor into `RoutingUrlFor`, so `RoutingUrlFor` takes this arm. A test class then includes `RoutingUrlFor` above a parent that holds the `class_attribute :default_url_options` reader (`actionview/test/activerecord/polymorphic_routes_test.rb`).

A JS property holds both halves. trails' `mattrWriter` (`packages/activesupport/src/module-ext.ts`) therefore cannot seat a writer-only instance half on a ruby-compat `Module` carrier without hiding the ancestor's reader. On trails#8987 the 40 `PolymorphicPathRoutesTest` cases failed with `Object.keys(undefined)` at `action-dispatch/routing/url-for.ts:109`. `mattrWriter` now skips the Module instance half when the carrier has no reader half, carrying `@inventedArm if — CONVERGEABLE` pointing at this story. ruby-compat's `rbModAttrWriter` has the same shape.

A filler half that reads or writes through to the next object in the chain fixes dispatch. But `checkDefinitionVisibility` (`packages/ruby-compat/src/object.ts:706-728`) and the super lookup in `include.ts` (~:660) would then see the filler, and `respond_to?(:x=)` would wrongly answer true (`attribute_accessor_test.rb` `test_should_not_create_instance_writer`).

## Acceptance criteria

- [ ] ruby-compat can represent an accessor property with one half absent, and that half defers to the next object in the prototype chain for get/set.
- [ ] `method_defined?` / `respond_to?` / `rbFSend` / super lookup treat the absent half as undefined there and keep walking.
- [ ] `mattrWriter` on a Module seats its instance writer unconditionally, and the `@inventedArm if` receipt is removed.
- [ ] `PolymorphicPathRoutesTest` and `ModuleAttributeAccessorTest` stay green.
