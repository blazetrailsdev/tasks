---
title: "objectWith awaits an async block before restoring; with_production_debouncer uses it"
status: ready
updated: 2026-11-18
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`with_production_debouncer` (`vendor/turbo-rails/v2.0.23/test/test_helper.rb:25-33`) is `Turbo::ThreadDebouncer.with(debouncer_class: Turbo::Debouncer, &block)`, ActiveSupport's `Object#with` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/with.rb`). trails' `objectWith` (`packages/activesupport/lib/core-ext/object/with.ts`) restores in a sync `finally`, so it puts the old values back before an async block settles. `packages/turbo/test/test-helper.ts` therefore saves and restores `debouncerClass` by hand.

## Acceptance criteria

- `objectWith` awaits a thenable block result before restoring, as Ruby's `ensure` runs after the block returns.
- `withProductionDebouncer` calls `objectWith(ThreadDebouncer, { debouncerClass: Debouncer }, block)`, and its hand-rolled save/restore is removed.
