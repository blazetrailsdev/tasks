---
title: "finisher-runs-before-set-helpers-path-message-pack-after-finisher-hook"
status: draft
updated: 2026-10-21
rfc: "0142-trailties-surfaced-deviations"
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

Found while upgrading trailmap to trails `421c220b18`: an application's
`app/helpers` no longer reach its views. After `Trails.initialize()`,
`ApplicationController.helpersPath` is `[]` and `helper(":all")` included
nothing, so a `.tse` view naming an app helper raises
`ActionView::Template::Error: renderMarkdown is not defined`
(trailmap `test/helpers/app-helpers-in-views.test.ts`, via
`scripts/app-helpers-probe.ts`).

Cause, two changes combining:

- trails#8911 moved `Railties::Helpers#inherited`
  (`packages/actionpack/src/action-controller/trailties/helpers.ts`) to boot:
  `setup_main_autoloader` (`packages/trailties/src/application/finisher.ts:73-78`)
  imports every `app/controllers` module and calls `defineController`, which
  runs `inherited`. `inherited` reads `ActionController.helpersPath()`, which
  is only set by `action_controller.set_helpers_path`
  (`packages/trailties/src/trailties/action-controller.ts:74-88`).
- trails#8736 declared `active_support.require_message_pack`
  (`packages/trailties/src/trailties/active-support.ts:88-90`) and
  `action_dispatch.require_message_pack`
  (`packages/trailties/src/trailties/action-dispatch.ts:115-117`) with
  `{ after: "finisher_hook" }`. `Initializable::Collection#tsort` visits an
  initializer's `after` as a child, so the whole Finisher chain
  (`add_generator_templates` … `finisher_hook`) is emitted at the position of
  the first railtie initializer that names it. In trailmap's tsorted order
  `setup_main_autoloader` is #16 and `action_controller.set_helpers_path` #38.

So every controller is "inherited" with an empty helpers path. In Rails the
Finisher runs after every railtie initializer
(`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb`), and
Rails' activesupport/actiondispatch railties have no initializer ordered after
`finisher_hook` (`vendor/rails/v8.0.2/activesupport/lib/active_support/railtie.rb`).

## Acceptance criteria

- After boot, `setup_main_autoloader` runs after `action_controller.set_helpers_path`
  for an application that loads `@blazetrails/trailties/all`, and an
  `ApplicationController` sees `app/helpers` (`helper(":all")` included them).
- The message_pack load stays awaited at boot without pulling the Finisher
  chain ahead of railtie initializers (e.g. converge onto a placement Rails'
  tsort would order the same way).
- A trailties test boots an app with the activesupport and actiondispatch
  railties loaded and asserts an app helper is callable from a `.tse` view;
  it fails on the current ordering.
