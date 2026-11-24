---
title: "Small packages: close the last 1-4 tests each"
status: ready
rfc: "0000-near-complete-packages-to-100"
cluster: small-packages
packages:
  [actioncable, actionmailbox, actionmailer, activejob, rack-session, sqlite3, mini-magick, turbo]
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

Measured 2026-11-24 at trails `4330f807e1`. Each of these packages is between
1 and 4 tests short of 100% on `parity:test`.

Missing tests (Rails paths under `vendor/rails/v8.0.5.2/`; gem paths under the
gem's vendored tree):

- `actioncable/test/channel/base_test.rb` (actioncable):
  - unsubscribed? method returns correct status
- `actioncable/test/channel/stream_test.rb` (actioncable):
  - concurrent unsubscribe_from_channel and stream_from do not raise RuntimeError
- `actionmailbox/test/controllers/ingresses/mailgun/inbound_emails_controller_test.rb` (actionmailbox):
  - receiving an inbound email from Mailgun with a timestamp slightly ahead of local time
  - rejecting an inbound email from Mailgun with a timestamp from the future
- `activejob/test/cases/logging_test.rb` (activejob):
  - retry different queue logging
- `test_database.rb` (sqlite3):
  - interrupt closed
- `lib/mini_magick/tool_spec.rb` (mini-magick):
  - accepts options
- `selector_assertions_test.rb` (rails-dom-testing):
  - assert select root xml

Skips without a `PERMANENT-SKIP:` line:

- actionmailer: 4. 0255 recorded them as blocked on an operator decision;
  bring that decision to the operator.
- rack-session: 1.
- turbo-rails: 1. 0255 recorded it as blocked on an open trailties story;
  verify that story is still open.

Apply the triage rule in this RFC's README (§ "Triage rule"). Every item ends
ported, permanent with a citation, listed for an operator ruling, or filed as a
blocking story. Before calling an item permanent, try to disprove its
receipt.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for actioncable, actionmailbox,
      actionmailer, activejob, rack-session, sqlite3, mini-magick,
      rails-dom-testing and turbo-rails.
- [ ] Every remaining skip in them carries a cited `PERMANENT-SKIP:` line.
- [ ] Items needing a ruling are listed in the PR body and left unreceipted.

## Verification

```sh
pnpm parity:changed
```
