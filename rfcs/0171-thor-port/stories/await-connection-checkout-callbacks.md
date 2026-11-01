---
title: "ConnectionPool awaits async checkout callbacks"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ConnectionPool#checkoutAndVerify` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:663`) calls `c._runCheckoutCallbacks(...)` without awaiting it. Rails runs them in line (`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`, `checkout_and_verify`). An async `:checkout` callback therefore settles after the connection is handed out. `active_record/railties/console_sandbox.rb:3-5` needs exactly that: `begin_transaction(joinable: false)` after checkout. This blocks `console-sandbox-rollback-and-irb-helpers`.

## Acceptance criteria

- [ ] `checkoutAndVerify` awaits the checkout callback chain, and a rejection reaches its existing cleanup arm.
- [ ] A test proves an async `:after` checkout callback completes before `checkout` resolves.
