---
title: "Port Mail::Body, Part, PartsList and AttachmentsList"
status: draft
updated: 2026-10-22
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-header-field-and-field-list", "mail-encodings-and-utilities", "mini-mime-port"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/mail/v2.8.1/lib/mail/body.rb` (305: boundary splitting, encoding), `part.rb` (119),
`parts_list.rb` (131: sort order) and `attachments_list.rb` (107, over
`MiniMime`).

## Acceptance criteria

- Ported at their Ruby names; `body_spec.rb`, `part_spec.rb`,
  `parts_list_spec.rb` and `attachments_list_spec.rb` pass.
