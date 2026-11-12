---
title: "ConnectionPool's reaper and SolidCable's listener run on ruby-compat Thread"
status: draft
updated: 2026-11-12
rfc: "0234-no-void-promises"
cluster: constructors
packages: [activerecord, solid-cable]
deps: [constructor-creates-no-promise-lint-rule]
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

RFC § Design 2(b). `connection-pool.ts:291` does `void this.reaper.run()`;
`Reaper` already spawns a `Thread` (`connection-pool/reaper.ts:46-47`), so
only the bookkeeping around it is async. `solid-cable.ts:86` stores
`_stopped` and swallows its rejection. Rails:
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/reaper.rb`.

## Acceptance criteria

- [ ] `Reaper#run` is synchronous as in Rails (`Thread.new` inside), and the constructor calls it with no promise.
- [ ] SolidCable's listener is a `Thread`; shutdown waits with `join`.
- [ ] An exception in either thread is reported, not swallowed (test).
- [ ] The `constructor` mark drops by 2; with `async-initialize-becomes-static-new` it reaches 0.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
