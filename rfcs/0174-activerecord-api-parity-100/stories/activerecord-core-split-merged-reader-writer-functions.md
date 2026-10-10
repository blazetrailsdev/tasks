---
title: "activerecord: split core.ts's merged reader/writer functions into Rails' two methods"
status: done
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8506
claim: "2026-10-10T18:39:36Z"
assignee: "sqlite3-pg-and-load-schema-driver-shaped-arms-left-after-the-top-level-pass"
blocked-by: null
closed-reason: null
---

## Context

Two `core.rb` reader/writer pairs are each ONE function in
`packages/activerecord/src/core.ts`, switched on an optional argument, where
Rails has two methods (CLAUDE.md § "Decomposition": one Rails method is one TS
method):

- `connectionClass(this, value?)` (`core.ts:572`) is both
  `def self.connection_class=(b)` and `def self.connection_class`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:226-232`). Its
  parameter is `value`, where Rails names it `b`. After trails PR 8383 the
  `[included]` hook hands the same function to `Object.defineProperty` as both
  `get` and `set`.
- `destroyAssociationAsyncJob(this, value?)` (`core.ts:453`) is both
  `def self.destroy_association_async_job` (`core.rb:27-34`) and the
  `singleton_class.alias_method :destroy_association_async_job=,
:_destroy_association_async_job=` at `core.rb:36`. Its writer arm returns the
  value; Rails' writer is the `class_attribute` setter.

The converged shape is a reader and a writer per pair, each with the Rails
body and parameter name, exposed as a property. `filter_attributes` /
`filter_attributes=` already has it: a static accessor pair on
`Core::ClassMethods`.

`destroy_association_async_job` is called as a method today
(`associations/association.ts:576`, `associations/builder/association.ts:219`),
so making it a property touches those call sites and
`destroy-association-async-job.test.ts`.

## Acceptance criteria

- [ ] `connection_class` and `connection_class=` are separate bodies; the writer's parameter is `b`.
- [ ] `destroy_association_async_job` is a reader with the `core.rb:27-34` body, including the `rescue NameError`; the writer is the `_destroyAssociationAsyncJob` class-attribute setter under its alias.
- [ ] No function in `core.ts` switches reader/writer on an optional argument.
- [ ] `pnpm parity:api:params` and `parity:api:calls` stay green.
