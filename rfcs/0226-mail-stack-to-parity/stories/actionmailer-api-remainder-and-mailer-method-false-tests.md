---
title: "Port ActionMailer.eager_load!, Base#instrument_payload / instrument_name / _protected_ivars, Parameterized#params, and stop counting mailer methods named test_* as tests"
status: claimed
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "actionmailer"
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: "2026-11-10T12:34:00Z"
assignee: "mail-parity-api-credits-object-literal-modules"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` actionmailer 224/230: `action_mailer.rb` `eager_load!`
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer.rb`), `base.rb`
`instrument_payload`, `instrument_name`, `_protected_ivars`, `parameterized.rb`
`params` / `params=`. `pnpm parity:test`: `base_test.rb` misses "adding inline
attachments while rendering mail works" (:313), and `test_helper_test.rb`
reports three "parameter args" tests that are the mailer method
`def test_parameter_args` (`test_helper_test.rb:27`), not tests; the Ruby
extractor already skips `test_*` actions in controller classes
(`scripts/test-compare/extract-ruby-controller-actions.test.ts:30`).

## Acceptance criteria

- [ ] The six members are ported at their Rails names in their Rails files.
- [ ] The Ruby test extractor skips `def test_*` in a class whose superclass is
      `ActionMailer::Base`, with a fixture test; actionmailer's denominator
      drops by 3.
- [ ] "adding inline attachments while rendering mail works" is ported by name.
