---
title: "mail-message-equals-and-initialize-copy-dup"
status: in-progress
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9760
claim: "2026-11-05T21:36:24Z"
assignee: "actionmailer-base-test-remaining-attachments-multipart-defaults"
blocked-by: null
closed-reason: null
---

## Context

message.rb:373-381 Message#== compares dup.tap { message_id= }.encoded, and message.rb:384-387 initialize_copy is @header = @header.dup. packages/mail/src/message.ts equals rebuilds from encoded and initializeCopy rebuilds a Header from its encoded form. Message#encoded also reads a Uint8Array body as latin1 text.

## Acceptance criteria

- equals and initializeCopy converge on rbObjDup and Header#dup as Rails writes them.
