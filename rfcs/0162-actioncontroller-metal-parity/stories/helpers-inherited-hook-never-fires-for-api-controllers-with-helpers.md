---
title: "The helpers inherited hook fires only from ActionController::Base's constructor, never for an API controller that includes Helpers"
status: done
updated: 2026-10-08
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8677
claim: "2026-10-08T13:26:12Z"
assignee: "helpers-inherited-hook-never-fires-for-api-controllers-with-helpers"
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Helpers::ClassMethods#inherited`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:68-74`) runs
for a subclass of any class that includes `AbstractController::Helpers`, and
`ActionController::Railties::Helpers#inherited`
(`action_controller/railties/helpers.rb:8-22`) for any class extended with it.
That covers an `ActionController::API` subclass that includes
`ActionController::Helpers`
(`actionpack/test/controller/api/with_helpers_test.rb`).

In trails the hook body lives in `fireInherited`
(`packages/actionpack/src/action-controller/trailties/helpers.ts`), and its only
caller is `ActionController::Base`'s constructor
(`packages/actionpack/src/action-controller/base.ts:416`). trails#8571 added the
`default_helper_module!` arm there. A controller that reaches `Helpers` without
descending from `Base` — `class WithHelpersController extends API` plus
`include(WithHelpersController, Helpers)`, as
`action-controller/base.trails.test.ts` builds — never fires it, so its
subclasses get no default helper module and no `helpersPath`.

## Acceptance criteria

- A subclass of an `API` controller that includes `ActionController::Helpers`
  gets its default helper module (`FooController` → `FooHelper`) and the
  railtie's `helpersPath`, with a test.
- The firing point is shared with `Base`'s, not a second copy of the body.
- Coordinate with `port-action-controller-helpers-and-the-inherited-hook`,
  which decides when the hook fires.
