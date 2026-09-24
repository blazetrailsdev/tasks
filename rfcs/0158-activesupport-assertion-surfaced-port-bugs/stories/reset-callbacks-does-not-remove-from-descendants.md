---
title: "reset-callbacks-does-not-remove-from-descendants"
status: ready
updated: 2026-09-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-cache-xml-json-callbacks` (RFC 0132).
Parked test: `packages/activesupport/src/callbacks.test.ts` ›
`ResetCallbackTest` › `reset impacts subclasses`.

Rails (`vendor/rails/activesupport/test/cases/callbacks_test.rb:1094-1106`)
builds a class with `before :hello`, a subclass adding `before :world`, runs the
subclass (2 events), then calls `klass.reset_callbacks :foo` and runs the
subclass again: **3** events — the parent's `:hello` is removed from the
subclass chain too. `reset_callbacks`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb`, `def reset_callbacks`)
walks `ActiveSupport::DescendantsTracker.descendants(self)` and deletes the
parent's callbacks from each descendant's chain before clearing its own.

trails' `Callbacks.resetCallbacks` (`packages/activesupport/src/callbacks.ts`)
only clears the receiver's own chain; a subclass prototype that already copied
the chain (`getCallbackChains`) keeps `:hello`, so the test sees **4**.

## Acceptance criteria

- `resetCallbacks` removes the receiver's callbacks from every descendant's
  chain, mirroring Rails' `reset_callbacks` body.
- Un-skip `ResetCallbackTest › reset impacts subclasses`; it passes unchanged.
