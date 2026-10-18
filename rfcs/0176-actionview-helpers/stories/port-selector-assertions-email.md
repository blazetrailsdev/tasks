---
title: "Port SelectorAssertions#assert_dom_email once ActionMailer exists"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
