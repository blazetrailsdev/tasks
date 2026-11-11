---
title: "Port net-smtp's test_sslcontext.rb and the rest of test_starttls.rb"
status: ready
updated: 2026-11-11
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "net-smtp"
deps:
  - "net-smtp-tests-at-convention-paths"
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/net-smtp/v0.5.1/test/net/smtp/test_sslcontext.rb` (226 lines, 15 tests)
is unported, and 7 of `test_starttls.rb`'s 11 tests are missing
(`vendor/net-smtp/v0.5.1/test/net/smtp/test_starttls.rb:1-128`).

## Acceptance criteria

- [ ] Both files are ported at their convention paths with every test by name.
