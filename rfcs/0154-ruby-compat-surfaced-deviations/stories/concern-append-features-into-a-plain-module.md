---
title: "Concern#append_features cannot include a Concern into a plain (non-Concern) Module"
status: draft
updated: 2026-09-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::Concern#append_features`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concern.rb:129-140`)
accepts any module as `base`. If `base` is itself a Concern (it has
`@_dependencies`), the concern is recorded as a dependency. Otherwise the
concern is included for real: `return false if base < self`, the dependencies
are included into `base`, then `super`, then `base.extend ClassMethods` and
`base.class_eval(&@_included_block)`. `base` may be a plain, non-Concern
`Module`. `actionview/lib/action_view/railtie.rb:97-101`
(`ActionView::RoutingUrlFor.include(ActionDispatch::Routing::UrlFor)`) is
exactly that case.

trails' `Concern.appendFeatures` (`packages/activesupport/src/concern.ts`) only
handles two bases: a Concern, and a class. For a plain ruby-compat `Module`
base, the else-branch calls `isModuleIncluded(base as AnyClass, this)`,
`include(base as AnyClass, dep)` and
`Module.prototype.appendFeatures.call(this, base as AnyClass)`, all of which
read `base.prototype`. A `Module` has none; its members live in its carrier.
So since trails#8185 made `Module#include` send `append_features`
(`eval.c:1159-1160`), `new Module((m) => m.include(UrlFor))` with the UrlFor
Concern module (`packages/actionpack/src/action-dispatch/routing/url-for.ts`)
cannot work. This blocks `url-for-is-a-plain-object-module-not-a-linkable-module`,
which wants `include(RoutingUrlFor, UrlFor)`.

## Converged shape

`Concern.appendFeatures` follows `concern.rb:129-140` for a `Module` base:
`base < self` via the module's own ancestry, dependencies included into the
module, then `super` as a module-into-module include (ruby-compat's
nested-module splice in `Module#include`), then `ClassMethods`, then the
included block evaluated with `this` bound to the module.

## Acceptance criteria

- Including a Concern with an `included` block into a plain `Module`, then
  including that module into a class, runs the block once on the plain module
  (Rails' `class_eval` target) and exposes the Concern's methods to the class's
  instances.
- `concern.test.ts` stays green.
