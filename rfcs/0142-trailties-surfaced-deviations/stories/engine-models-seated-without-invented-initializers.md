---
title: "engine-models-seated-without-invented-initializers"
status: draft
updated: 2026-11-22
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

Rails autoloads `ActionMailbox::InboundEmail` from the engine's `app/models` through Zeitwerk,
so `rescues/invalid_statement.html.erb` (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/middleware/templates/rescues/invalid_statement.html.erb:15`)
can read `ActionMailbox::InboundEmail.table_name` on first use. trails seats `InboundEmail`
only when `packages/actionmailbox/lib/inbound-email.ts` is imported. trails#10610 added an
`action_mailbox.app` initializer to `packages/actionmailbox/lib/engine.ts`, copying
activestorage's `active_storage.app` (`packages/activestorage/lib/engine.ts:265`).
`vendor/rails/v8.0.5.2/actionmailbox/lib/action_mailbox/engine.rb` has no such initializer.
That initializer is receipted `CONVERGEABLE` against this story.

## Acceptance criteria

- The application loader seats an engine's models (ActionMailbox's `InboundEmail`,
  ActiveStorage's `Blob` / `Attachment` / `VariantRecord`) the way Zeitwerk does for an
  engine's `app/models`, without an engine initializer Rails does not define.
- `action_mailbox.app` and `active_storage.app` are removed.
- `MiddlewareExceptionsTest > displays statement invalid template correctly` stays green.
