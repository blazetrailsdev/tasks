---
title: "actionmailbox: unpark the Postmark and Sendgrid non-UTF-8 ingress tests"
status: draft
updated: 2026-11-20
rfc: "0000-last-mile-parity"
cluster: small-packages
packages: [actionmailbox]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The Postmark and Sendgrid ingress controller tests for non-UTF-8 bodies are
skipped `BLOCKED: ascii-8bit-param-encoding-answers-a-js-string-not-bytes`,
which is done (trails#10216). Rails:
`vendor/rails/v8.0.2/actionmailbox/test/controllers/ingresses/postmark/inbound_emails_controller_test.rb`,
`.../sendgrid/inbound_emails_controller_test.rb`. One test also sits under a
describe that does not match its Rails class, so it is not credited.

## Acceptance criteria

- [ ] Both tests run as the Rails bodies and pass.
- [ ] The misplaced test moves under the describe matching its Rails test class, name unchanged.
- [ ] `parity:test` shows actionmailbox with no skipped or missing tests.

## Verification

```sh
pnpm vitest run packages/actionmailbox/test/controllers/ingresses && pnpm parity:test --missing --package actionmailbox
```
