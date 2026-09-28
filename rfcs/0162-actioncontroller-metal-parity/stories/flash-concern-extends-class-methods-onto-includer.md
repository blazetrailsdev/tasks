---
title: "Flash's ClassMethods are Base statics, so including Flash into a Metal subclass throws"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
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

Surfaced in trails#8220. Rails' `ActionController::Flash` is an `ActiveSupport::Concern`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:6-49`), and its
`ClassMethods` (`add_flash_types` `:34-45`, `action_methods` `:47-49`) are extended onto
whatever class includes it. `included do` (`:9-14`) then calls `add_flash_types(:alert, :notice)`
on that class.

In trails, `packages/actionpack/src/action-controller/metal/flash.ts` exports a `Flash` module
with `static [included]`. But `addFlashTypes` and `actionMethods` are hand-assigned statics on
`ActionController::Base` (`base.ts`: `static addFlashTypes = addFlashTypes; static override actionMethods = actionMethods`).
So `include(class extends Metal {}, Flash)` throws: the hook calls `base.addFlashTypes`, which
does not exist on a bare `Metal` subclass. `delegate :flash, to: :request` (`:12`) likewise
lives on `Base` as `get flash()`, not on the module.

This is why `FlashIntegrationTest#flash usable in metal without helper`
(`packages/actionpack/src/action-controller/controller/flash.test.ts`) still builds a
`Base` instead of Rails' `Class.new(ActionController::Metal) { include ActionController::Flash }`
(`vendor/rails/v8.0.2/actionpack/test/controller/flash_test.rb:359-372`).

## Acceptance criteria

- `Flash[included]` extends the host with `addFlashTypes` / `actionMethods` (`extend()` /
  `Extended<>` from `@blazetrails/activesupport`) before calling `addFlashTypes("alert", "notice")`,
  and installs the `flash` delegation. The hand-assigned statics and `get flash()` on `Base` go.
- `flash usable in metal without helper` builds `class extends Metal {}` + `include(…, Flash)`
  and asserts the instance responds to `alert` and `notice` (`rbObjRespondTo`), as
  `flash_test.rb:359-372` does.
