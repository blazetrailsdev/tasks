---
title: "Vendor mail 2.8.1, mini_mime 1.1.5 and net-smtp 0.5.1 with their specs"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-vendor
packages: ["mail", "mini-mime"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/Gemfile.lock:339-343,355,394` pins `mail` 2.8.1,
`mini_mime` 1.1.5 and `net-smtp` 0.5.1. The packaged `mail` gem ships no
specs, so vendor from the GitHub tags (`mikel/mail`, `discourse/mini_mime`,
`ruby/net-smtp`) through `vendor/sources.ts`, as rack-test and marcel were.

## Acceptance criteria

- `vendor/mail/v2.8.1/`, `vendor/mini_mime/v1.1.5/` and `vendor/net-smtp/v0.5.1/`
  populate via `pnpm vendor:fetch`, with `spec/` / `test/` included.
- `sources.lock.json` records each tag's sha.
