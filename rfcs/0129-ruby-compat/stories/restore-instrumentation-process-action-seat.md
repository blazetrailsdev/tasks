---
title: "Converge MimeType#symbol onto the colon convention so start_processing's Symbol arm fires"
status: claimed
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: 19
pr: null
claim: "2026-09-04T17:20:47Z"
assignee: "sync-reads-of-async-reflection-retire-with-rfc-0073"
blocked-by: null
closed-reason: null
---

## Context

`port-instrumentation-process-action-raw-payload` ported
`ActionController::Instrumentation#process_action`
(`vendor/rails/actionpack/lib/action_controller/metal/instrumentation.rb:60-84`)
in full: the eight-key `raw_payload`, both notifications, `response`/`status`
on the payload and `append_info_to_payload` in the `ensure`, composed at
`packages/actionpack/src/action-controller/base.ts:906`. One half of that
story's `format` criterion is still open.

Rails passes `request.format.ref`, and `Mime::Type#ref` is `symbol || to_s`
(`mime_type.rb:285`). trails' `MimeType#ref()` mirrors that, but
`MimeType#symbol` carries a bare `"html"`
(`packages/actionpack/src/action-dispatch/http/mime-type.ts:166,179`) rather
than the repo's colon convention `":html"` (CLAUDE.md, "A Ruby Symbol is a JS
string, never a JS `Symbol`"). `LogSubscriber#start_processing` branches on
`format.is_a?(Symbol)` (`log_subscriber.rb:19`, ported at
`action-controller/log-subscriber.ts:44` via `isSymbol`/`symbolToS`), so with
the bare spelling that `to_s.upcase` arm can never fire for a payload this
seat produces.

Converging it is registry-wide rather than local: `MimeType.registry` is keyed
by the symbol (`mime-type.ts:225`), as are `registerAlias` (`:241`),
`unregister` (`:248`) and the `EXTENSION_LOOKUP` seeding (`:232`).
`NullType#symbol` is already `null`, matching `Mime::NullType#ref`'s `nil`
(`mime_type.rb:376`), and needs no change.

## Acceptance criteria

- `MimeType#symbol` carries the colon convention (`":html"`), with registry,
  alias/unregister and extension-lookup keying converged with it.
- `LogSubscriber#start_processing`'s `is_a?(Symbol)` arm fires as it does in
  Rails for a `process_action` payload.
- actionpack suite green; `pnpm parity:api:calls` shows no new rows.
