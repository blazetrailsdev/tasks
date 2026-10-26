---
title: "Port SelectorAssertions#assert_dom_email once ActionMailer exists"
status: blocked
updated: 2026-10-19
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps:
  - actionmailer-message-delivery-parameterized-and-delivery-job
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-19T13:12:06Z"
assignee: "port-nokogiri-css-xpath-visitor"
blocked-by: "waiting on an ActionMailer package: ActionMailer::Base.deliveries does not exist in trails (no packages/actionmailer)"
closed-reason: null
---

## Context

`assert_dom_email` / `assert_select_email`
(`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/selector_assertions.rb:290-302`) read
`ActionMailer::Base.deliveries`, then each delivery's `parts`, `part["Content-Type"]` and `part.body`. trails has no
ActionMailer package, so the method is unported; `assertDomEncoded` beside it is ported in
`packages/actionview/src/testing/selector-assertions.ts`.

## Acceptance criteria

- [ ] `assertDomEmail` / `assertSelectEmail` ported in `packages/actionview/src/testing/selector-assertions.ts` once
      `ActionMailer::Base.deliveries` exists, with Rails' `assert !deliveries.empty?, "No e-mail in delivery list"`.
