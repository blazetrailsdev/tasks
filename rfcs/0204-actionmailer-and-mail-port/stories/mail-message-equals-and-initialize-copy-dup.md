---
title: "mail-message-equals-and-initialize-copy-dup"
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

message.rb:373-381 Message#== compares dup.tap { message_id= }.encoded, and message.rb:384-387 initialize_copy is @header = @header.dup. packages/mail/src/message.ts equals rebuilds from encoded and initializeCopy rebuilds a Header from its encoded form. Message#encoded also reads a Uint8Array body as latin1 text.

## Acceptance criteria

- equals and initializeCopy converge on rbObjDup and Header#dup as Rails writes them.
