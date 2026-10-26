---
title: "configuration-test-framework-deprecators"
status: blocked
updated: 2026-10-26
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-26T01:18:25Z"
assignee: "configuration-test-framework-deprecators"
blocked-by: "waiting on ActionMailbox, ActionMailer, ActionText and ActiveStorage ports seating their deprecators; none of those packages exist yet"
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/configuration_test.rb:4265-4283` makes 15 assertions: `ActiveSupport::Deprecation._instance` is in `deprecators.each`, plus one `deprecators[:x]` equality per framework. trailties seats `actionCable`, `actionController`, `actionDispatch`, `actionView`, `activeJob`, `activeModel`, `activeRecord`, `activeSupport` and `trailties` (grep `deprecators.set(` under `packages/trailties/src`). ActionMailbox, ActionMailer, ActionText and ActiveStorage are not ported, so a partial port reds the assertion-count ratchet (`scripts/test-compare/lint-assertion-mismatches.ts`), and those are not language shortcomings that `assertion-receipts.ts` can cover. trails#9314 added the ActionCable seat and dropped its partial port of this test for that reason.

## Acceptance criteria

- [ ] Once the four packages seat their deprecators, the test is ported in `packages/trailties/src/application/configuration.test.ts` with all 15 assertions, and the assertion gate is green.
