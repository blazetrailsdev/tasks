---
title: "Port message_spec.rb's remaining missing-required-fields, deliver, replying and parts examples"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 550
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`spec/mail/message_spec.rb` misses, by describe: `handling missing required
fields: > mime emails` and its `content type` (15, :1300),
`content-transfer-encoding` (6, :1512), `mime-version` (5, :1244), `charset` /
`charset=` (3, :1452-1475), `convert_to_multipart` (1, :1497) and two direct
examples (:1416); `deliver` (8, :1876); `replying` (13, :2093-2159);
`nested parts` (1, :1852); "adding parts should preserve the charset of the
mail" (:2004).

## Acceptance criteria

- [ ] The 57 listed examples are ported by name in `packages/mail/test/message.test.ts`.
