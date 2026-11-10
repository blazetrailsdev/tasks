---
title: "Move net-smtp's tests to the convention paths parity:test expects"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "net-smtp"
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` reports net-smtp at 0/95 with 73 misplaced: the gem's
`test/net/smtp/test_smtp.rb` (55), `test_response.rb` (14) and
`test_starttls.rb` (4 of 11) are ported in `packages/net-smtp/test/smtp.test.ts`
and `response.test.ts`, but the convention paths are
`packages/net-smtp/test/net/smtp/test-smtp.test.ts`, `test-response.test.ts`,
`test-starttls.test.ts` (the same `test-` prefix rake's tests keep).

## Acceptance criteria

- [ ] The tests move by `git mv` to the convention paths, with the
      starttls examples split into `test-starttls.test.ts`.
- [ ] `pnpm parity:test --package net-smtp` reports 73 matched and 0 misplaced.
