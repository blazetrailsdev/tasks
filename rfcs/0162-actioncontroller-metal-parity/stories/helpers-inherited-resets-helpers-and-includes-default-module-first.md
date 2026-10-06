---
title: "AbstractController::Helpers inherited resets _helpers and includes the default helper module beneath class-body helpers"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps:
  - port-action-controller-helpers-and-the-inherited-hook
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

Rails' `AbstractController::Helpers::ClassMethods#inherited`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:68-74`) is

```ruby
def inherited(klass)
  klass._helpers = nil
  klass.class_eval { default_helper_module! } unless klass.anonymous?
  super
end
```

trails#8571 ported the `default_helper_module!` arm into `fireInherited`
(`packages/actionpack/src/action-controller/trailties/helpers.ts`). Two parts of
the Rails body could not land, because `fireInherited` runs at a controller's
first construction, after its class body:

- `klass._helpers = nil` is not executed. Run late, it discards helpers the
  class body already declared through `helper` / `helper_method`
  (`controller/helper.test.ts` "helper method arg" and `IsolatedHelpersTest`
  go red).
- The default helper module is included above the helpers the class body
  declared. Rails includes it first, so it sits beneath them
  (`helpers.rb:199-202`, `Module#include` precedence).

Both converge once `port-action-controller-helpers-and-the-inherited-hook`
fires the hook at class definition.

`isAnonymous` (`packages/activesupport/src/module-ext.ts`) also answers true
for a name with no leading capital, where Rails' `anonymous?` is `name.nil?`
(`activesupport/lib/active_support/core_ext/module/anonymous.rb:27`): JS names
`const klass = class extends Base {}` after its binding, and Ruby's
`klass = Class.new(Base)` stays anonymous.

## Acceptance criteria

- The hook body runs `klass._helpers = nil` before `default_helper_module!`,
  with the helper tests green.
- A helper declared in the class body overrides a same-named method of the
  controller's default helper module, with a test.
- `isAnonymous` is decided: either it reads a real anonymity record, or the
  name test is recorded as the settled shape.
