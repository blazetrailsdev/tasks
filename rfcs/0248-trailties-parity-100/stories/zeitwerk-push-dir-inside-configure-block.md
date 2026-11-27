---
title: "zeitwerk-push-dir-inside-configure-block"
status: draft
updated: 2026-11-27
rfc: "0248-trailties-parity-100"
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

`vendor/rails/v8.0.5.2/railties/test/application/zeitwerk_integration_test.rb:58` "root directories manually set by the user are honored (once)" calls `Rails.autoloaders.once.push_dir(..., namespace:)` inside `add_to_env_config "development"`, i.e. inside the `Rails.application.configure do ... end` block of `config/environments/development.rb`.

In trails `Loader#pushDir` (`packages/zeitwerk/lib/loader/config.ts:24`) is async (it awaits `isDir`), while `Trailtie#configure` (`packages/trailties/lib/trailtie.ts:152`) calls its block synchronously and drops its return value. A `pushDir` written inside the block is a floating promise, so the test cannot be ported faithfully. The `(main)` sibling ported in trails#10830 runs from `config/initializers`, a module body that can `await`.

## Acceptance criteria

- [ ] Decide (operator) whether `configure` awaits an async block, or `pushDir`'s directory check becomes synchronous.
- [ ] Port "root directories manually set by the user are honored (once)" into `packages/trailties/test/application/zeitwerk-integration.test.ts` under its Rails name.
