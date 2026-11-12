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
closed-reason: null
---

## Context

RFC § Design 2. Six constructors start a promise:
`activerecord/src/connection-adapters/abstract/connection-pool.ts:291`,
`rackup/lib/server.ts:300`, `trailties/lib/commands/console.ts:59-60`,
`solid-cable/lib/action-cable/subscription-adapter/solid-cable.ts:86`,
`actiontext/lib/content.ts:73`, `activerecord/src/schema-dumper.ts:80`.

## Acceptance criteria

- [ ] A type-aware rule reports, inside a `constructor` body: a thenable-typed call expression (dropped, voided, stored or chained), `.then` / `.catch` / `.finally`, and an `async` IIFE.
- [ ] `new Thread(...)` from `@blazetrails/ruby-compat` is not reported; reading or storing its promise is.
- [ ] A class declaring `static async new` must declare a `protected` or `private` constructor; a public one is reported.
- [ ] RuleTester covers each arm; runs repo-wide against an only-shrink mark seeded at 6.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
