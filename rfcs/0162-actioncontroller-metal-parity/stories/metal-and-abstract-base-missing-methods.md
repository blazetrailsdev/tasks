---
title: "Port Metal#response_code / #to_a, AbstractController::Base's instance readers and allow_browser; seat Collector's module"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
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

Single-method gaps across three Rails files, from
`pnpm parity:api --package actioncontroller` / `abstractcontroller`:

- `ActionController::Metal`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal.rb`):
  `alias :response_code :status` (`:227`) and `to_a` (`:280`), the Rack triple.
  `pnpm parity:api:extra` scores `toRackResponse` on `metal.ts` novel.
- `AbstractController::Base` (`abstract_controller/base.rb`): the instance
  `controller_path` (`:167`) and `action_methods` (`:172`), which delegate to the
  class; `inspect` (`:204`); and `alias send_action send` (`:233`), which
  `process_action` calls.
- `AllowBrowser::ClassMethods#allow_browser(versions:, block:, **options)`
  (`action_controller/metal/allow_browser.rb:57`), the class macro that installs
  a `before_action`. trails ports the checker but not the macro.

`pnpm parity:api --inheritance` reports `MimeResponds::Collector` extending
`AbstractCollector` (`packages/actionpack/src/action-controller/metal/mime-responds.ts:14`);
Rails' `class Collector` has no superclass and
`include AbstractController::Collector` (`metal/mime_responds.rb:251-252`), a
module.

One arity row on the same area: `Flash#action_methods` (`metal/flash.rb:47`)
takes no argument; trails passes `superMethods`. (The other actioncontroller
arity row, `LogSubscriber#exist_fragment?`, is a measurement defect: Rails
defines it as `def #{method}(event)` inside a `class_eval` heredoc,
`log_subscriber.rb:77-88`, and the extractor reads zero parameters. It is
`api-extractor-reads-class-eval-heredoc-defs-as-zero-arity` in RFC 0167 (gates),
not a trails change.)

## Acceptance criteria

- Each member exists at its Rails name and host with Rails' body; `toA` replaces
  `toRackResponse`.
- `Collector` includes `AbstractController::Collector` with `include()` rather
  than extending it; the inheritance row is gone.
- `process_action` dispatches through `sendAction`.
- The `Flash#action_methods` arity row is gone.
- `pnpm parity:api` reports `metal.rb`, `abstract_controller/base.rb` and
  `metal/allow_browser.rb` at 100%.
