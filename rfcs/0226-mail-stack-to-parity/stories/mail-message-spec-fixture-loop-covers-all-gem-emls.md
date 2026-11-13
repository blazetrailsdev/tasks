---
title: "Copy the remaining 48 gem email fixtures so message_spec's parses-fixture loop covers all 100"
status: draft
updated: 2026-11-13
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
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

`message_spec.rb:123-128` (`vendor/mail/2.8.1/spec/mail/message_spec.rb`) runs `Mail.read` over every fixture matched by `Dir.glob(fixture_path('emails/**/*.eml'))`. That is 100 files in `vendor/mail/2.8.1/spec/fixtures/emails`. The trails port in `packages/mail/test/message.test.ts` (trails#10066) uses `Dir.globAsync` over `packages/mail/test/fixtures/emails/**/*.eml`, which holds only the 52 files copied so far. So 48 fixtures are never parsed by `parses #{path} fixture`.

## Acceptance criteria

- [ ] Every `.eml` under `vendor/mail/2.8.1/spec/fixtures/emails` is copied byte for byte into `packages/mail/test/fixtures/emails`.
- [ ] Any fixture with raw control bytes is covered by `BINARY_RE` in `scripts/ci/check-control-bytes.sh`, which already exempts `multi_charset/`.
- [ ] The `parses #{path} fixture` loop passes on every copied fixture. Any fixture that fails to parse is a parser bug, and is fixed or filed with its Rails `file:line`.
