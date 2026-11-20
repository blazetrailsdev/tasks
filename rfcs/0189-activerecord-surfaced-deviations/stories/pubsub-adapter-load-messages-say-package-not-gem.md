---
title: "pubsub-adapter-load-messages-say-package-not-gem"
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

The operator ruled on trails#10414 that adapter-loading error messages say "package" where Rails says "gem", because trails ships through npm. trails#10414 applied that to activerecord's `ConnectionAdapters.resolve` `LoadError`s.

Action Cable's pubsub adapter loading has the same two Rails phrases. Both are in `packages/actioncable/lib/server/configuration.ts`, and `test/server/configuration.trails.test.ts:85,94` asserts them:

- `:78`: "…you've added the necessary adapter gem to your Gemfile."
- `:84`: "Missing a gem it depends on?"

The Rails source is `vendor/rails/v8.0.2/actioncable/lib/action_cable/server/configuration.rb`, in `pubsub_adapter`.

## Acceptance criteria

- [ ] `:78` reads "adapter package to your package.json" and `:84` reads "Missing a package it depends on?".
- [ ] `configuration.trails.test.ts`'s expected strings are updated to match.
