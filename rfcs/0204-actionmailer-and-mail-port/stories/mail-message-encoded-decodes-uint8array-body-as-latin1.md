---
title: "Message#encoded decodes a Uint8Array body as latin1"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9772
claim: "2026-11-06T03:17:13Z"
assignee: "mail-message-encoded-decodes-uint8array-body-as-latin1"
blocked-by: null
closed-reason: null
---

## Context

`Mail::Message#encoded` (`vendor/mail/2.8.1/lib/mail/message.rb:1803-1809`) appends `body.encoded(content_transfer_encoding)` to the header buffer. `packages/mail/src/message.ts` `encoded()` turns a `Uint8Array` body into text with `new TextDecoder("latin1")`. That is an extra arm Rails does not have, and per CLAUDE.md § "A String has no encoding tag either", the place that reads a binary result as text should converge where it reads it. Noted in story `mail-message-equals-and-initialize-copy-dup` and not addressed by trails#9760.

## Acceptance criteria

- `Body#encoded` either returns a string for every transfer encoding that `encoded` concatenates, or `Message#encoded` keeps the bytes. No latin1 decode is left in `Message#encoded`.
- The existing mail tests stay green.
