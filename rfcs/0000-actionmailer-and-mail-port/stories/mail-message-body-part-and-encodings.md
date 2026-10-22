---
title: "Port Mail::Message, Header, Body, Part, attachments and Encodings"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-fields-and-elements", "mini-mime-port"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`mail/lib/mail/{message,header,body,part,parts_list,attachments_list,field,field_list,utilities,mail}.rb`
and `encodings/` (base64, quoted-printable, 7bit, 8bit, binary,
`UnixToUnix`). `Message#encoded` fixes header order and boundary shape, which
ActionMailer's tests assert. Strings follow CLAUDE.md "Ruby Strings are JS string
primitives"; non-UTF-8 charsets transcode through npm `iconv-lite`.

## Acceptance criteria

- `Mail.new`, `Mail::Message`, `Part`, `Body`, `Header`, `AttachmentsList` and
  `Encodings` ported; `Mail.register_interceptor` / `register_observer` present.
- `deliver` / `deliver!` are `async` and dispatch to `delivery_method`.
- The message, body, part, header and encodings specs pass. Split on claim if
  over the LOC ceiling.
