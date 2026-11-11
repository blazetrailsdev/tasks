---
title: "Port mail_helper_test.rb and mail_layout_test.rb"
status: in-progress
updated: 2026-11-11
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "actionmailer"
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9982
claim: "2026-11-11T03:11:36Z"
assignee: "actionmailer-mail-helper-and-mail-layout-tests"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailer/test/mail_helper_test.rb` (137 lines, 8 tests)
and `mail_layout_test.rb` (97 lines, 7 tests) have no convention TS files.
`packages/actionmailer/test/mail-helper.trails.test.ts` exists and may already
hold ports under the wrong file; move any that match Rails names.

## Acceptance criteria

- [ ] `mail-helper.test.ts` and `mail-layout.test.ts` port all 15 tests by name.
