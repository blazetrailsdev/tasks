---
title: "DatabaseConfig#new_connection invents a still-loading arm Rails does not have"
status: draft
updated: 2026-10-06
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DatabaseConfig#new_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/database_config.rb:24-26`)
is one line: `adapter_class.new(configuration_hash)`. It has no branch and raises nothing of its own;
an unresolvable adapter raises from `adapter_class` (`:16-18`, `ActiveRecord::ConnectionAdapters.resolve`).

trails' `newConnection` (`packages/activerecord/src/database-configurations/database-config.ts:61-72`)
adds an arm Rails does not have: when `adapterClass()` answers a Promise (the adapter module is still
being dynamically imported) it swallows the rejection and throws
`RuntimeError('Adapter "…" is still loading — await adapterClass() before newConnection.')`.
`inspect` (`:50-60`) carries the same Promise arm and prints `this.adapter` in place of the class.
`adapterClass()` itself (`:42-48`) returns `ctor | Promise<ctor>`, where Rails' `adapter_class`
returns the class.

trails#8601 only changed the throw's class from bare `Error` to `RuntimeError` for
`blazetrails/rails-error-parity`; the arm is unconverged and carries no `@inventedArm` receipt.

## Acceptance criteria

- [ ] `newConnection` is `new (this.adapterClass())(this.configurationHash)` with no still-loading arm, or the arm carries the receipt a ratified shortcoming requires.
- [ ] `adapterClass()` answers the class synchronously (adapters resolved before first use), or the async resolution is moved to the one awaited site (`validateBang`) so sync readers never see a Promise.
- [ ] `inspect` prints `adapter_class` as Rails does, with no Promise arm.
