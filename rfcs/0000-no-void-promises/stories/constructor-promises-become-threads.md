---
title: "ConnectionPool's reaper and SolidCable's listener run on ruby-compat Thread, not a voided promise"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: constructors
packages: []
deps: [constructor-creates-no-promise-lint-rule]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 2(b). `connection-pool.ts:291` does `void this.reaper.run()`;
`Reaper` already spawns a `Thread` (`connection-pool/reaper.ts:46-47`), so the
async part of `run` is the bookkeeping around it. `solid-cable.ts:86` stores
`_stopped` and swallows its rejection. Rails:
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/reaper.rb`.

## Acceptance criteria

- [ ] `Reaper#run` is synchronous as in Rails (`Thread.new` inside), and the constructor calls it without a promise.
- [ ] SolidCable's listener is a `Thread`; shutdown waits with `join`.
- [ ] An exception in either thread is reported, not swallowed (test).
