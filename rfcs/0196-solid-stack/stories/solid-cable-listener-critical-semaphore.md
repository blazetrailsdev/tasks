---
title: "SolidCable Listener stops through a @critical semaphore and Thread#raise(Stop), as Rails does"
status: draft
updated: 2026-11-14
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

SolidCable's `Listener` (`packages/solid-cable/lib/action-cable/subscription-adapter/solid-cable.ts`, `interruptible` / `shutdown` / `_stopped`) stops its thread by rejecting a private `_stopped` promise, which `interruptible` races against the block with `Promise.race`. Rails (`vendor/solid_cable/<ver>/lib/action_cable/subscription_adapter/solid_cable.rb`, `Listener#initialize` / `#listen` / `#interruptible` / `#shutdown`) does it differently:

- `@critical = Concurrent::Semaphore.new(0)` is "normally held" by the listener thread.
- `interruptible` does `@critical.release; yield; ensure @critical.acquire`.
- `shutdown` does `@critical.acquire; thread.raise(Stop); @critical.release; thread.join`.
- `listen`'s `ensure` does `@critical.release`.

The class carries `@missingRailsCall acquire — PERMANENT` and `@missingRailsCall release — PERMANENT`. Those receipts are debt: ruby-compat has a `Thread`, and a semaphore plus a thread-interrupt mechanism are portable. Found in trails#10052.

## Acceptance criteria

- [ ] `Listener` keeps `@critical` as a ruby-compat semaphore (port `Concurrent::Semaphore` if absent), and `interruptible` / `shutdown` / `listen` mirror the Rails release/acquire order.
- [ ] `shutdown` interrupts the listener thread with `Stop` through a ruby-compat `Thread#raise` (port it if absent) instead of rejecting `_stopped`; `_stopped` / `_stop` / `_isStopped` are removed.
- [ ] Both `@missingRailsCall` receipts are removed.
- [ ] solid-cable's listener tests still pass, with one covering shutdown during `interruptible`.
