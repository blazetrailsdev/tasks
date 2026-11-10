---
title: "Port actionmailer/test/caching_test.rb"
status: draft
updated: 2026-11-09
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "actionmailer"
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

`vendor/rails/v8.0.2/actionmailer/test/caching_test.rb` (246 lines, 19 tests:
fragment caching in mailer views, `cache` helper, `expire_fragment`,
`perform_caching` toggles) has no TS file. Fixture mailers live in
`vendor/rails/v8.0.2/actionmailer/test/mailers/caching_mailer.rb` and views
under `test/fixtures/caching_mailer/`.

## Acceptance criteria

- [ ] `packages/actionmailer/test/caching.test.ts` ports all 19 tests by name,
      with the fixture mailer and views mirrored.
