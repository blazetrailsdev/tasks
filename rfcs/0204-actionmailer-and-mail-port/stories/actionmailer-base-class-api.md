---
title: "Port ActionMailer::Base's class side (base.rb:1-~560)"
status: done
updated: 2026-11-04
rfc: "0204-actionmailer-and-mail-port"
cluster: actionmailer
packages: ["actionmailer"]
deps: ["actionmailer-package-and-support-modules"]
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9715
claim: "2026-11-04T16:46:26Z"
assignee: "actionmailer-base-class-api"
blocked-by: null
---

## Context

`actionmailer/lib/action_mailer/base.rb` is 1,071 lines. This slice is the
class side: `default`, `register_observer(s)` / `register_interceptor(s)`,
`unregister_*`, `mailer_name`, `email_address_with_name`, `deliver_mail`,
`supports_path?`, `method_missing` / `respond_to_missing?` (a CLAUDE.md
`method_missing` table row), and `process`.

## Acceptance criteria

- Ported at their Ruby names; the `method_missing` row added to CLAUDE.md.
- `base_test.rb`'s class-level tests pass.
