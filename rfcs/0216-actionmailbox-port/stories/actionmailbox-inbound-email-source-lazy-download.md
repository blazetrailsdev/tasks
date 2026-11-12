---
title: "InboundEmail#source reads raw_email.download without explicit attachment/blob loads"
status: blocked
updated: 2026-11-12
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-11T22:11:37Z"
assignee: "actionmailbox-inbound-email-source-lazy-download"
blocked-by: "operator ruling 2026-10-31 (packages/activestorage/CLAUDE.md, method_missing definers): One/Attachment delegation stays sync and raises on an unloaded association; source() keeps its explicit loads until that ruling changes"
closed-reason: null
---

## Context

Rails `ActionMailbox::InboundEmail#source` is `@source ||= raw_email.download`
(`vendor/rails/v8.0.2/actionmailbox/app/models/action_mailbox/inbound_email.rb`).
`raw_email` (`Attached::One`) reaches `download` through two
`delegate_missing_to` hops, attachment and then blob, and each association loads
lazily on read.

trails' `packages/actionmailbox/src/inbound-email.ts` `source()` adds two loads
before the download: `await this.rawEmail.load()` and
`await (await this.rawEmail.attachment)?.blob`. A record that `RoutingJob`
reloads has neither association loaded, and the sync `delegate_missing_to`
reaches neither. `Attached::One#load`
(`packages/activestorage/lib/attached/one.ts`) loads the attachment only, and
activestorage's "isAttached does not load the blob" test pins that. The relay
controller test (`src/controllers/ingresses/relay/inbound-emails-controller.test.ts`)
repeats the same two loads before `rawEmail.download()`.

## Acceptance criteria

- `source()` is `this._source ??= await this.rawEmail.download()`, with no
  explicit attachment or blob load. `One` / `Attachment` delegation awaits its
  own unloaded association, so an awaited `download` on a reloaded record works,
  as Rails' lazy read does.
- The relay test reads `inboundEmail.rawEmail.download()` with no pre-loads, as
  Rails does.
- "delayed routing" (`unit/mailbox/routing.test.ts`) and activestorage's
  `one.trails.test.ts` stay green.
