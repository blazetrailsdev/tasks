---
title: "restore-instrumentation-process-action-seat"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
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

`port-instrumentation-process-action-raw-payload` took its own sanctioned
fallback: `instrumentAction` in
`packages/actionpack/src/action-controller/metal/instrumentation.ts` was a
callerless trails invention, so it was deleted rather than patched. The Rails
seat it was standing in for is still absent.

`ActionController::Instrumentation#process_action`
(`vendor/rails/actionpack/lib/action_controller/metal/instrumentation.rb:60-84`)
is a private override that builds one eight-key `raw_payload`
(`controller`, `action`, `request`, `params`, `headers`, `format`, `method`,
`path`), publishes it to `start_processing.action_controller`, then wraps
`super` in `process_action.action_controller`, setting `payload[:response]`
and `payload[:status]` and running `append_info_to_payload(payload)` in an
`ensure`.

Two things block that seat today:

1. **No super chain for module `process_action` overrides.** Rails composes
   `Instrumentation#process_action` over `AbstractController::Base#process_action`
   by module ancestry. trails has `AbstractController::Base#processAction`
   (`packages/actionpack/src/abstract-controller/base.ts:307`) and
   `ActionController::Rendering.processAction`
   (`action-controller/metal/rendering.ts:215`), but the latter is a
   `this`-typed function that is never installed on a class and is only
   exercised via `.call(host)` in its test — there is no working `super`
   composition for a third override to join.
2. **`format` cannot fire `start_processing`'s Symbol arm.** Rails passes
   `request.format.ref` (`Mime::Type#ref` is `symbol || to_s`,
   `mime_type.rb:285`), and `LogSubscriber#start_processing` branches on
   `format.is_a?(Symbol)` (`log_subscriber.rb:19`, ported at
   `action-controller/log-subscriber.ts:44` via `isSymbol`/`symbolToS`).
   trails spells `MimeType#symbol` as a bare `"html"`
   (`action-dispatch/http/mime-type.ts:166,179`) rather than the repo's
   colon convention `":html"` (CLAUDE.md, "A Ruby Symbol is a JS string"),
   so that arm can never fire. Converging it is registry-wide:
   `MimeType.registry` is keyed by the symbol (`mime-type.ts:225`), as are
   `registerAlias`, `unregister` and `EXTENSION_LOOKUP`.

## Acceptance criteria

- `MimeType#symbol` carries the colon convention (`":html"`), with the registry,
  alias/unregister and extension-lookup keying converged with it, and
  `LogSubscriber#start_processing`'s `is_a?(Symbol)` arm firing as in Rails.
- `Instrumentation#process_action` exists at the Rails name on the Rails
  receiver, building the eight-key `raw_payload` in Rails order and publishing
  it to both notifications, with `response`/`status` set on the payload and
  `appendInfoToPayload` in the `ensure` position — composed over
  `AbstractController::Base#processAction` by a real super chain, not a free
  function.
- `pnpm parity:api:calls` shows no new rows; actionpack suite green.
