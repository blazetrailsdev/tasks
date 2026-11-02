---
title: "transfer-encoding-to-s-reaches-encoded-header"
status: draft
updated: 2026-11-02
rfc: "0204-actionmailer-and-mail-port"
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

`TransferEncoding.to_s` (`vendor/mail/2.8.1/lib/mail/encodings/transfer_encoding.rb:31`) answers `NAME`. `packages/mail/src/encodings/transfer-encoding.ts:31` spells it `static toString`, which `rbObjAsString` does not read for a class, so `Message#identify_and_set_transfer_encoding` (`packages/mail/src/message.ts:1044`) writes `Content-Transfer-Encoding: Mail::Encodings::SevenBit` where Rails writes `7bit`. Seen in `Mail.new(...).encoded`.

## Acceptance criteria

- `Mail.new("x").encoded` carries `Content-Transfer-Encoding: 7bit`, with a test.
