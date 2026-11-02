---
title: "mail-message-delivery"
status: draft
updated: 2026-11-02
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps:
  - mail-delivery-methods-smtp-sendmail-file-test
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

Peeled from trails#9626. message.rb:236-280 (inform_observers, inform_interceptors, deliver, deliver!, delivery_method) is unported, as are the delivery_handler flow's Mail.delivery_method and Configuration lookup (mail.rb:103).

## Acceptance criteria

- Those methods ported in message.ts at their Ruby names, async per the delivery client.
