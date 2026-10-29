---
title: "Port ActionMailer TestHelper, TestCase and Preview"
status: ready
updated: 2026-10-29
rfc: "0204-actionmailer-and-mail-port"
cluster: actionmailer
packages: ["actionmailer"]
deps: ["actionmailer-message-delivery-parameterized-and-delivery-job"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`test_helper.rb` (264 lines: `assert_emails`, `assert_enqueued_email_with`, …),
`test_case.rb` (126) and `preview.rb` (142, with `Previews` and interceptors).

## Acceptance criteria

- Ported at their Ruby names on Vitest; assertions follow CONTRIBUTING.md
  "Porting a Minitest assertion".
- `test_helper_test.rb`, `test_case_test.rb` and the preview tests pass.
- `parity:test` reports actionmailer at its full test count.
