---
title: "Port ActionMailbox::Relayer and its test"
status: claimed
updated: 2026-11-06
rfc: "0216-actionmailbox-port"
cluster: amb-ingress
packages: ["actionmailbox"]
deps: ["actionmailbox-package-and-parity-enrollment", "ruby-compat-net-http-post-client"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: "2026-11-06T12:47:08Z"
assignee: "actionmailbox-relayer"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/relayer.rb` (75 lines): `Result`, a
`Struct.new(:status_code, :message)` with `success?`, `failure?`,
`transient_failure?` (`"4."`) and `permanent_failure?` (`"5."`) (`:9-25`);
`CONTENT_TYPE`, `USER_AGENT` (`:27-28`, built from `ActionMailbox.version`);
`initialize(url:, username: "actionmailbox", password:)` (`:32-34`);
`relay` (`:36-51`) mapping the response class and the four rescues to
`Result`s; private `post` (`:54-59`, Basic auth via `Base64.strict_encode64`)
and the memoized `client` (`:61-72`).

Test: `test/unit/relayer_test.rb` (8), which stubs with WebMock's
`stub_request` / `assert_requested` and reads `test/fixtures/files/welcome.eml`.

## Acceptance criteria

- `Relayer` and `Relayer.Result` are ported line for line; `Result` is a
  ruby-compat `Struct`; the predicates are `isSuccess`, `isFailure`,
  `isTransientFailure`, `isPermanentFailure`.
- `relay` is async and keeps Rails' rescue order, each arm's status code and
  message text.
- `relayer_test.rb` passes, names verbatim, stubbing HTTP the way the RFC's
  Open question 2 settles (recommended: an in-process `node:http` server
  recording each request).
