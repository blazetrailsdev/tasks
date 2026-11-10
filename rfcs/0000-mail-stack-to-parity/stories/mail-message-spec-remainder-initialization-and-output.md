---
title: "Port message_spec.rb's remaining initialization, plain-text, header, YAML, == and output examples"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`spec/mail/message_spec.rb` is 109/203 (the stories that ported it,
`mail-message-spec-port-rest` among them, are done). Missing, by describe:
`initialization` (14, from :84), `initialization > YAML serialization` (2, :206),
`accepting a plain text string email` (10, :341),
`directly setting values of a message > setting headers` (4, :691),
`output` (3, :1581) and `output > decoding bodies` (1, :1648),
`helper methods > ==` (3, :1710).

## Acceptance criteria

- [ ] The 37 listed examples are ported by name in `packages/mail/test/message.test.ts`.
