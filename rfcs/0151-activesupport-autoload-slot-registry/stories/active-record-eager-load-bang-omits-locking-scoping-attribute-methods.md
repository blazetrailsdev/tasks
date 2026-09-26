---
title: "ActiveRecord.eager_load! omits Locking/Scoping/AttributeMethods: make them Autoload namespaces"
status: draft
updated: 2026-09-26
rfc: "0151-activesupport-autoload-slot-registry"
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

`ActiveRecord.eager_load!` (`activerecord/lib/active_record.rb:499-507`) is `super`, then
`Locking`, `Scoping`, `Associations`, `AttributeMethods`, `ConnectionAdapters` and
`Encryption` `.eager_load!`. trails#8115 ported `super`, `Associations`, `ConnectionAdapters`
and `Encryption` (`packages/activerecord/src/active-record.ts` `eagerLoadBang`). The other three
are missing because they are not Autoload namespaces in trails:

- `ActiveRecord::AttributeMethods` (`active_record.rb:131-146`): `extend ActiveSupport::Autoload`,
  `autoload :CompositePrimaryKey`, then an `eager_autoload` block with `BeforeTypeCast`, `Dirty`,
  `PrimaryKey`, `Query`, `Read`, `Serialization`, `TimeZoneConversion`, `Write`.
- `ActiveRecord::Locking` (`active_record.rb:148-155`): `eager_autoload` of `Optimistic`, `Pessimistic`.
- `ActiveRecord::Scoping` (`active_record.rb:157-164`): `eager_autoload` of `Default`, `Named`.

## Converged shape

The same shape as `Associations`, `ConnectionAdapters` and `Encryption` in
`packages/activerecord/src/namespaces.ts`. Each module is an `{ name, loadPath }` object
`extend`ed with `Autoload`, with the listed `autoload` calls, and seated on `ActiveRecord`.
Each child module seats itself on its namespace. `ActiveRecord.eagerLoadBang` then calls
`Locking`, `Scoping`, `Associations`, `AttributeMethods`, `ConnectionAdapters` and `Encryption`
in Rails' order.

## Acceptance criteria

- The three namespaces exist and eager-autoload the children Rails lists.
- `ActiveRecord.eagerLoadBang` makes all six calls in Rails' order. Extend the spy-order test
  in `namespaces.trails.test.ts`.
- A plain-node import of the built modules as entry modules shows no TDZ.
