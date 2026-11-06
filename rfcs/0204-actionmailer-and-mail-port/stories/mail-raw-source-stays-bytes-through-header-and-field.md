---
title: "Mail raw source stays bytes through Header and Field instead of a UTF-8 decode at the scan sites"
status: claimed
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-06T14:47:07Z"
assignee: "mail-raw-source-stays-bytes-through-header-and-field"
blocked-by: null
closed-reason: null
---

## Context

trails#9768 made `Message#initWithString` accept a `Uint8Array` raw source. The regex scan sites decode the bytes as UTF-8 with `new TextDecoder().decode(...)`: `Message#parseMessage`, `#setEnvelopeHeader` (`packages/mail/src/message.ts`) and `Part#parseMessage` (`packages/mail/src/part.ts`). Each carries `@inventedArm decode — PERMANENT`. Ruby splits the binary String as bytes (`vendor/mail/2.8.1/lib/mail/message.rb:1979-1983` `parse_message`, `part.rb:102-111`). Header and Field values stay binary there and are only transcoded later; the encoded-word path is `utilities.rb:441-443`. The decode replaces invalid UTF-8 with U+FFFD, so a Latin-1 8-bit raw source is corrupted where Ruby keeps the bytes. Reading one character per byte (CLAUDE.md § "A String has no encoding tag either") fails `attachments-list.test.ts` › "should decode an attachment without ascii compatible filename", because `Header` and `Field` take JS text.

## Acceptance criteria

- `Header#initialize` / `splitHeader` and `Field.parse` accept a binary (`Uint8Array`) raw source, transcoding the way Mail's `Utilities` does.
- `parseMessage` / `setEnvelopeHeader` scan the bytes one character per byte and pass byte parts on. The `@inventedArm decode` receipts are deleted.
- A test reads a raw source with a Latin-1 8-bit body and gets its bytes back unchanged.
