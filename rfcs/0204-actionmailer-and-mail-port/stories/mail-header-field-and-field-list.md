---
title: "Port Mail::Header, Field, FieldList and IndifferentHash"
status: claimed
updated: 2026-11-01
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-remaining-header-fields"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: "2026-11-01T23:49:02Z"
assignee: "mail-header-field-and-field-list"
blocked-by: null
---

## Context

`vendor/mail/2.8.1/lib/mail/header.rb` (237), `field.rb` (283, the field-name to class table and
lazy parsing), `field_list.rb` (header ordering) and `indifferent_hash.rb`
(147). `FieldList`'s ordering fixes the header order ActionMailer's tests assert.

## Acceptance criteria

- Ported at their Ruby names; `header_spec.rb`, `field_spec.rb` and
  `field_list_spec.rb` pass.
