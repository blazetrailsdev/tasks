---
title: "actionview-base-logger-class-attribute-and-included-mattr-seats"
status: closed
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
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
closed-reason: "FALSIFIED: the logger and erb_trim_mode= halves shipped in trails#8795; the remainder is refiled as mime-negotiation-ignore-accept-header-is-defined-on-the-includer"
---

## Context

Left over from `port-remaining-class-hosted-accessor-instance-seats`, which converted the other
`ActionView::Base` accessors (`actionview/lib/action_view/base.rb:161-181`) to
`cattrAccessor` / `classAttribute`.

- `class_attribute :logger` (`base.rb:182`) is still `static logger: unknown = null` in
  `packages/actionview/src/base.ts`. In Rails the class attribute's instance reader is defined
  on `Base` itself, so it shadows `ControllerHelper#logger`
  (`action_view/helpers/controller_helper.rb:32-34`) from the included `Helpers`. trails'
  `view.logger` is still the ControllerHelper function, and
  `packages/actionview/src/base.test.ts` "logger reads through to the controller's" asserts
  that non-Rails behaviour (`view.logger()` as a call). Converting it flips that test.
- `delegate :erb_trim_mode=, to: "ActionView::Template::Handlers::ERB"` (`base.rb:185`) has no
  member on `Base`; `parity:api --missing` lists `erb_trim_mode= → tseTrimMode` under
  `base.rb`. The `ActionView` namespace has no `Template.Handlers` seat to read at call time.
- `ActionDispatch::Http::MimeNegotiation`'s `included do mattr_accessor :ignore_accept_header`
  (`actionpack/lib/action_dispatch/http/mime_negotiation.rb:19-21`) defines the accessor on the
  includer (`Request`). trails declares it on a `MimeNegotiation` class and `Request` forwards
  with a hand-written static getter/setter pair
  (`packages/actionpack/src/action-dispatch/http/request.ts`, `static get ignoreAcceptHeader`).

## Acceptance criteria

- `ActionView::Base.logger` is declared with `classAttribute`, `view.logger` reads the class
  attribute as in Rails, and the base.test.ts assertion is corrected to Rails' behaviour.
- `Base` answers `tseTrimMode=` by delegating to the TSE handler (`base.rb:185`), and the
  `erb_trim_mode=` row under `base.rb` matches.
- `ignore_accept_header` is defined on `Request` by `MimeNegotiation`'s `included` block and
  the forwarding accessor pair in `request.ts` is gone.
