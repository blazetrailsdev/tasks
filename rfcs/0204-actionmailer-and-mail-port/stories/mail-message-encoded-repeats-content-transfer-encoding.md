---
title: "mail-message-encoded-repeats-content-transfer-encoding"
status: draft
updated: 2026-11-04
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

`Message#encoded` (`packages/mail/src/message.ts`, `readyToSendBang` → `identifyAndSetTransferEncoding`) is not idempotent: each call appends another `Content-Transfer-Encoding` header, and its value is `Mail::Encodings::SevenBit` (the class's Ruby name via `rbObjAsString`) where Ruby writes `7bit` (`vendor/mail/2.8.1/lib/mail/message.rb:2038-2046`; `TransferEncoding.to_s` answers the encoding's token). Ruby's `content_transfer_encoding=` (`message.rb:601-603`) replaces the field through `header[]=`.

Found porting the delivery-method specs: `smtp_spec.rb:15-29` and `file_delivery_spec.rb:30-44` compare the delivered text with `mail.encoded`, which differs on the second call, so the trails ports assert on the Subject line instead.

## Acceptance criteria

- Two successive `encoded()` calls answer the same string, with one `Content-Transfer-Encoding: 7bit` header.
- `smtp.test.ts` "should send emails from given settings" and `file-delivery.test.ts` "should send an email to a file" compare against `mail.encoded()` as the gem specs do.
