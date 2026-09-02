---
title: "railtie-configuration-drops-respond-to-super-and-shadow-guard"
status: draft
updated: 2026-09-02
rfc: "0112-one-rails-thing-n-trails-things"
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

`Rails::Railtie::Configuration` exposes its dynamic option bag through
`method_missing` / `respond_to?`
(`railties/lib/rails/railtie/configuration.rb:88-108`). trails spells those as
`get` / `set` / `respondTo` on `packages/trailties/src/trailtie/configuration.ts`,
and two arms of the Ruby were missing:

- `respond_to?` is `super || @@options.key?(name.to_sym)` (`:90-92`) — a real
  method answers true. The port checked only the option bag, so
  `config.respondTo("toPrepare")` returned false.
- `method_missing`'s setter arm raises a `NoMethodError` reading "Cannot assign
  to X, it is a configuration method" when `actual_method?` (`:95-97`) says the
  key names a real method (`:99-105`).
  The port wrote it into the bag silently, so setting the key
  `eagerLoadNamespaces` quietly shadowed the reader instead of raising.

Surfaced by review of PR #7386.

## Converged shape

Port both arms, with `actual_method?` extracted as the private helper Rails
extracts, the same `NoMethodError` class and the same message string.

## Acceptance criteria

- [ ] `respondTo` answers true for a real method as well as a stored option.
- [ ] `set` raises `NoMethodError` with Rails' exact message when the key names
      a configuration method.
- [ ] `actual_method?` exists as a private helper, not inlined.
