---
title: "mail-message-spec-port"
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

Peeled from trails#9626. packages/mail/src/message.ts ports vendor/mail/2.8.1/lib/mail/message.rb; vendor/mail/2.8.1/spec/mail/message_spec.rb (2268 lines) is unported.

## Acceptance criteria

- message_spec.rb ported with verbatim names; every failure fixed in message.ts.
