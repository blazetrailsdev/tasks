---
title: "Port Mail::Message's parts, encoding and parsing (message.rb:1626-2156)"
status: claimed
updated: 2026-11-02
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-message-core"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-11-02T16:51:51Z"
assignee: "mail-body-part-and-attachments"
blocked-by: null
---

## Context

`message.rb:1626-2156`: `attachments`, `text_part` / `html_part`,
`add_part`, `add_file`, `convert_to_multipart`, `ready_to_send!`,
`encoded` (`:1803`), `to_s`, `decoded`, `parse_message` (`:1979`),
`identify_and_set_transfer_encoding` (`:2038`).

## Acceptance criteria

- Ported at their Ruby names; `encoded` byte-exact.
- The rest of `message_spec.rb` and `spec/mail/example_emails_spec.rb` pass.
