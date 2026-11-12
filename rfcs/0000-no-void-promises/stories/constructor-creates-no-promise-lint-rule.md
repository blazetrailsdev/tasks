---
title: "blazetrails/constructor-creates-no-promise reports promise creation inside a constructor"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 2. Six constructors start a promise today:
`activerecord/src/connection-adapters/abstract/connection-pool.ts:291`,
`rackup/lib/server.ts:300`, `trailties/lib/commands/console.ts:59-60`,
`solid-cable/lib/action-cable/subscription-adapter/solid-cable.ts:86`,
`actiontext/lib/content.ts:73`, `activerecord/src/schema-dumper.ts:80`.

## Acceptance criteria

- [ ] A type-aware rule reports, inside a `constructor` body: a thenable-typed call expression (dropped, voided, stored or chained), `.then` / `.catch` / `.finally`, and an `async` IIFE.
- [ ] `new Thread(...)` from `@blazetrails/ruby-compat` is not reported; reading its promise is.
- [ ] A class that declares `static async new` must declare a `protected` or `private` constructor; a public one is reported.
- [ ] RuleTester covers each arm; the rule runs repo-wide against an only-shrink mark.
