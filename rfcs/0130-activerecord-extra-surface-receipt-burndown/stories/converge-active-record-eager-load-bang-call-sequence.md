---
title: "converge-active-record-eager-load-bang-call-sequence"
status: draft
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord.eager_load!` (`vendor/rails/activerecord/lib/active_record.rb:499-507`) calls `super` (`ActiveSupport::Autoload#eager_load!`, `activesupport/lib/active_support/dependencies/autoload.rb:65-70`), and then `eager_load!` on Locking, Scoping, Associations, AttributeMethods, ConnectionAdapters and Encryption, in that order. trails' `eagerLoadBang` (`packages/activerecord/src/active-record.ts`) calls only Associations and Encryption, because trails has no `eagerLoadBang` on the other four modules and no `ActiveSupport::Autoload#eager_load!`. Related: `port-eager-load-autoloader-arms`.

## Acceptance criteria

- Port `ActiveSupport::Autoload#eager_load!`, or record in SKIP_GROUPS (with its reason) that ESM loads modules eagerly, and do the same for the four missing module-level `eager_load!` methods.
- `eagerLoadBang` makes Rails' calls in Rails' order.
