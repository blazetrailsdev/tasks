---
title: "adapter-not-found-message-says-package-not-gem"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
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

The operator ruled on trails#10414 that adapter-loading error messages say "package" where Rails says "gem", because trails ships through npm. trails#10414 converted `ConnectionAdapters.resolve`'s two `LoadError` messages (`packages/activerecord/lib/connection-adapters.ts`; Rails `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:50,54`).

One activerecord string in the same family still says gem: the `AdapterNotFound` raised for an unregistered adapter, "…you've added the necessary adapter gem to your Gemfile if it's not in the list of available adapters." (`connection-adapters.ts:38-43`; Rails `connection_adapters.rb:30-35`). `test/cases/database-configurations/resolver.test.ts:28` asserts that string verbatim.

## Acceptance criteria

- [ ] The `AdapterNotFound` message reads "adapter package to your package.json" in place of "adapter gem to your Gemfile".
- [ ] `resolver.test.ts`'s expected string is updated to match, and the test name is unchanged.
- [ ] No other "gem" remains in activerecord's adapter-loading messages.
