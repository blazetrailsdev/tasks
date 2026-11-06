---
title: "mail-message-parses-binary-raw-source"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9768
claim: "2026-11-06T02:07:05Z"
assignee: "mail-message-parses-binary-raw-source"
blocked-by: null
closed-reason: null
---

## Context

`Mail.read` (`packages/mail/src/mail.ts`) reads the file's bytes and calls
`forceEncoding(bytes, "UTF-8")` before `Mail.new`, a call `mail.rb:168-170`
does not make: Ruby hands the ASCII-8BIT String straight to `Message.new`,
and `Utilities` treats binary strings as UTF-8 when decoding
(`vendor/mail/2.8.1/lib/mail/utilities.rb:441-443`). The port's
`Message#initWithString` (`packages/mail/src/message.ts`) only accepts a
JS string. Per CLAUDE.md § "A String has no encoding tag", the call site that
reads binary as text converges there.

## Acceptance criteria

- `Message#initWithString` / `parseMessage` accept a `Uint8Array` raw source,
  so `Mail.new(bytes)` parses as Ruby's `Mail.new(binary_string)` does.
- `Mail.read` drops `forceEncoding` and its `@inventedArm forceEncoding` receipt;
  `attachments-list.test.ts`'s "reading emails with attachments" tests still pass.
