---
title: "activesupport: port the notifications and log-subscriber tests except the allocations assertion"
status: claimed
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: null
claim: "2026-11-22T03:09:35Z"
assignee: "flip-the-rails-ref-to-v8-0-5-1"
blocked-by: null
closed-reason: null
---

## Context

"subscribe events", "subscribe via top level api" (`notifications_test.rb`)
and log-subscriber "event attributes" are parked whole for want of an
allocation counter. CLAUDE.md "Runtime facts" (allocated-object count) says to
port the other assertions and receipt only `allocations`.

## Acceptance criteria

- [ ] All three run with every assertion except `allocations`, each dropped assertion a row in `assertion-receipts/activesupport.ts`.
