---
title: "Port net-smtp's remaining gem tests with a scripted FakeServer"
status: ready
updated: 2026-10-30
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/net-smtp/src/smtp.test.ts` ports only part of `vendor/net-smtp/v0.5.1/test/net/smtp/test_smtp.rb` and `test_starttls.rb`. Portable but missing: `test_start_auth_plain`, `test_start_auth_login`, `test_start_auth_cram_md5`, `test_unsuccessful_auth_xoauth2`, `test_with_starttls_auto`, `test_start_with_starttls_auto`, `test_start_with_starttls_false`. Tests asserting exact wire lines (`test_mailfrom_with_address`, `test_rcptto_with_address`, `test_send_smtputf*`, `test_mailfrom_with_smtputf_detection`), and scripted replies (`test_non_continue_auth_login`, `test_unsuccessful_data`, `test_tls_connect_timeout`, `test_eof_error_backtrace`) need a scripted fake server, as `FakeServer` in test_smtp.rb is, because `smtp-server` exposes neither.

## Acceptance criteria

- Each listed test is ported at its Rails name, or parked as `it.skip` under a `PERMANENT-SKIP:` line.
- A test fake server mirrors `FakeServer`'s `commands` and overridable replies.
