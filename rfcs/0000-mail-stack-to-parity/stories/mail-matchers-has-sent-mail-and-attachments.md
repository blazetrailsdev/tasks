---
title: "Port Mail::Matchers (has_sent_mail and attachment matchers)"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/lib/mail/matchers/has_sent_mail.rb:1-201` (34 members,
`HasSentEmailMatcher#matches?`, `from`, `to`, `with_subject`, `matching_body`,
`failure_message`, …) and `matchers/attachment_matchers.rb:1-44` (6) have no TS
files. They are an RSpec-protocol matcher API (`matches?`, `description`,
`failure_message`, `failure_message_when_negated`) over
`Mail::TestMailer.deliveries`; the gem ships no spec for them.

## Acceptance criteria

- [ ] `packages/mail/lib/matchers/has-sent-mail.ts` and `attachment-matchers.ts`
      port every member at its Ruby name as CLAUDE.md's predicate rule
      translates it (`matches?` is `isMatches`, `matches_on_sender?` is
      `isMatchesOnSender`), which is what `parity:api` matches on.
- [ ] A `*.trails.test.ts` exercises each matcher against `TestMailer.deliveries`,
      positive and negated, since the gem has no spec to port.
