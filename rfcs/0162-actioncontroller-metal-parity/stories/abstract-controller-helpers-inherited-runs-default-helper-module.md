---
title: "AbstractController::Helpers::ClassMethods#inherited runs default_helper_module! for each controller subclass"
status: draft
updated: 2026-10-04
rfc: "0162-actioncontroller-metal-parity"
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

Rails' `AbstractController::Helpers::ClassMethods#inherited`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:68-74`)
runs for every controller subclass:

```ruby
def inherited(klass)
  klass._helpers = nil
  klass.class_eval { default_helper_module! } unless klass.anonymous?
  super
end
```

So `PostsController` gets `PostsHelper` included with no declaration.
`ActionController::Railties::Helpers#inherited`
(`action_controller/railties/helpers.rb:8-22`) reaches it through `super`.

trails ports `defaultHelperModuleBang`
(`packages/actionpack/src/abstract-controller/helpers.ts`) with Rails' body, but
nothing calls it at subclass time: the only deferral point is
`fireInherited` / `inherited` in
`packages/actionpack/src/action-controller/trailties/helpers.ts`, which carries
the railtie's body alone and has no `super` arm. `defaultHelperModuleBang` is
reached only from `clearHelpers`.

`port-action-controller-helpers-and-the-inherited-hook` decides WHEN the hook
fires. This story is the missing body, whichever mechanism that one picks.

## Acceptance criteria

- The abstract `inherited` body runs once per controller subclass, before the
  railtie's: the subclass's own `_helpers` seat is reset and
  `defaultHelperModuleBang` runs unless the class is anonymous.
- A controller named `FooController` with a registered `FooHelper` constant
  renders `FooHelper`'s methods with no `helper` call; one with no such helper
  is unaffected (`NameError` swallowed, `helpers.rb:239-244`).
- No string-named `inherited` member is added to `abstract-controller/helpers.ts`
  (`SKIP_GROUPS` marks it `tsMirrorIsDrift`).
