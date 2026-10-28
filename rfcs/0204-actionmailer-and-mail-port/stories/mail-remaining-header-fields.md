---
title: "Port mail's remaining header fields"
status: draft
updated: 2026-10-22
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-common-and-address-fields"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The rest of `vendor/mail/2.8.1/lib/mail/fields/`: content-type, content-disposition,
content-transfer-encoding, content-id, content-location, content-description,
mime-version, date, message-id, in-reply-to, references, received, subject,
comments, keywords, optional field.

## Acceptance criteria

- Ported at their Ruby names; their `spec/mail/fields/*_spec.rb` pass.
