---
title: "ActionMailer::Base::NullMail answers every method with nil (Proxy)"
status: draft
updated: 2026-11-04
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer::Base::NullMail` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:654-668`) answers `respond_to?` with true for every name, and its `method_missing(...)` returns `nil`. So after an action that never called `mail`, any read off the message returns nil, for example `mailer.message.subject`.

trails#9715 ported it in `packages/actionmailer/src/base.ts` as plain methods: `body`, `header`, `isRespondTo` and `methodMissing`. Nothing intercepts an undefined name, so `nullMail.subject` reads `undefined`, and calling it throws a `TypeError` where Ruby returns nil.

## Acceptance criteria

- `NullMail` is a Proxy: any string name that `body` / `header` don't answer reads as a function returning `null`. `PROTOCOL_PROBES` / `then` are excluded, following CLAUDE.md § "Ruby protocol methods with a different JS mechanism".
- Add an `action_mailer/base.rb` NullMail note to the CLAUDE.md `method_missing` table.
- A test calls `subject()` on the message of an action that never called `mail`, and gets `null`.
