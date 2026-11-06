---
title: "mail-message-spec-port"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 800
priority: null
pr: trails#9766
claim: "2026-11-06T01:45:43Z"
assignee: "actionmailer-base-test-view-paths-fallback-locale-asset-host"
blocked-by: null
closed-reason: null
---

## Context

Peeled from trails#9626. packages/mail/src/message.ts ports vendor/mail/2.8.1/lib/mail/message.rb; vendor/mail/2.8.1/spec/mail/message_spec.rb (2268 lines) is unported.

## Acceptance criteria

- message_spec.rb ported with verbatim names; every failure fixed in message.ts.
