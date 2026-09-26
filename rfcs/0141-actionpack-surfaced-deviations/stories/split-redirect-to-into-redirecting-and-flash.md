---
title: "Split Base#redirectTo into Redirecting#redirect_to and Flash#redirect_to; port add_flash_types"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails splits redirecting across two modules on ActionController::Base:
`Redirecting#redirect_to(options = {}, response_options = {})`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb`) and
`Flash#redirect_to(options = {}, response_options_and_flash = {})`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:54-66`), which
extracts `_flash_types` and `flash:` then calls `super`.

trails has one `Base#redirectTo` in `packages/actionpack/src/action-controller/base.ts`
that carries both halves (trails#8152 added the Flash extraction there, over a
`_flashTypes` class attribute seeded `alert, notice` per `flash.rb:9-13`). The
invented `FlashTypeRegistry` (`metal/flash.ts`) duplicates `add_flash_types`
(`flash.rb:34-45`) and `action_methods` (`:47-49`) without being wired to the
controller.

## Acceptance criteria

- `Redirecting#redirect_to` is ported into `metal/redirecting.ts` and
  `Flash#redirect_to` into `metal/flash.ts`, the latter calling the former as its
  `super`; `Base` installs Flash's.
- `add_flash_types` / `action_methods` are ported onto the `_flash_types` class
  attribute; `FlashTypeRegistry` is deleted and `FlashTest`'s
  "redirect to with adding flash types" / "add flash type to subclasses" /
  "does not add flash type to parent class" are unskipped.
