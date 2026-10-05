---
title: "Store I18n.config as a thread variable so concurrent with_locale blocks do not share a locale"
status: draft
updated: 2026-10-05
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`I18n.config` is a thread variable in the gem:
`Thread.current.thread_variable_get(:i18n_config) || Thread.current.thread_variable_set(:i18n_config, I18n::Config.new)`
(`vendor/i18n/v1.14.8/lib/i18n.rb:57-65`), and `Config#locale` reads the
instance's `@locale` (`vendor/i18n/v1.14.8/lib/i18n/config.rb`). So each thread
has its own current locale.

trails keeps one process-wide `currentConfig`
(`packages/i18n/src/i18n.ts:55-64`), so every execution context shares one
locale. `withLocale` (`packages/i18n/src/i18n.ts`, `i18n.rb:347-359`) now
restores when an async block settles, but two concurrent
`ActiveJob::Translation` performs (`vendor/rails/v8.0.2/activejob/lib/active_job/translation.rb:8`)
in separate `Thread`s still see each other's locale while they await.
`Time.zone` had the same shape and was converged onto `IsolatedExecutionState`
in `packages/activesupport/src/time-zone-config.ts`.

ruby-compat's `Thread` has `get` / `set` (`Thread#[]` / `Thread#[]=`,
fiber-local in MRI) but no `thread_variable_get` / `thread_variable_set`
(`vendor/ruby/v3.3.11/thread.c`). `I18n.fallbacks` already reads
`Thread.current().get(":i18n_fallbacks")`
(`packages/i18n/src/backend/fallbacks.ts:14-22`).

## Acceptance criteria

- [ ] ruby-compat ports `Thread#thread_variable_get` / `thread_variable_set`, each with its `@noRailsEquivalent PERMANENT` receipt citing `thread.c`.
- [ ] `config()` / `setConfig()` in `packages/i18n/src/i18n.ts` read and write `:i18n_config` on `Thread.current()`, as `i18n.rb:57-65` does; the module-level `currentConfig` is gone.
- [ ] A `.trails.test.ts` runs two `withLocale` calls in separate `Thread`s that await inside the block, and each reads its own locale.
- [ ] `resetConfig` and every suite that seeds `config()` on the main thread and reads it inside a `new Thread` stay green.
