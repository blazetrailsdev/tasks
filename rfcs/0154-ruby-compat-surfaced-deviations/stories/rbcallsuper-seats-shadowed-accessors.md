---
title: "rbCallSuper seats shadowed accessors so getter super works through extend"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
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

`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb:23-25` is `def queue_adapter; self._test_adapter.nil? ? super : self._test_adapter; end` in `TestQueueAdapter::ClassMethods`. The trails port in `packages/activejob/src/test-helper.ts` (`ClassMethods.queueAdapter`, a static getter) hard-binds the `super` to `Reflect.get(QueueAdapterClassMethods, "queueAdapter", this)`.

The reason is that `rbCallSuper` (`packages/ruby-compat/src/include.ts:1781`) and the seat it reads (`superSlots` in `packages/ruby-compat/src/object.ts:29`, about `:836`) only seat a shadowed member that is a function. When `extend()` copies a getter over an existing getter, the shadowed accessor is not seated, so a ported zero-arg reader whose Ruby body calls `super` has no live-include `super`.

## Acceptance criteria

- [ ] When `include()` / `extend()` copies an accessor over an inherited accessor, the shadowed descriptor is seated, and `rbCallSuper` invokes its `get` (or its `set` for a writer) on the receiver.
- [ ] `TestQueueAdapter`'s `queueAdapter` getter calls `rbCallSuper` instead of `Reflect.get(QueueAdapterClassMethods, ...)`.
- [ ] There is a ruby-compat test covering getter `super` through `extend`.
