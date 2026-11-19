---
title: "finisher-awaits-async-load-hooks"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
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

`I18n::Railtie` registers `config.before_eager_load { |app| I18n::Railtie.initialize_i18n(app) }`
and `config.after_initialize { |app| ... }`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb:19-29`). In trails
`initialize_i18n`'s body is async: `I18n.load_path +=` is `setLoadPath`, which awaits
`backend.reloadBang()` (`packages/i18n/lib/config.ts:126-130`, ratified in
packages/i18n/CLAUDE.md "the load is an awaited step"), and `railties_load_path`'s
`existent` is async (`packages/trailties/lib/paths.ts:226`).

`runLoadHooks` / `executeHook` (`packages/activesupport/lib/lazy-load-hooks.ts:39-44,80-88`)
call each hook synchronously and drop its return value, and the finisher runs
`runLoadHooks("before_eager_load", this)` / `runLoadHooks("after_initialize", this)`
(`packages/trailties/lib/application/finisher.ts:148,164`) without awaiting. A hook that
returns a promise therefore has no owner (root CLAUDE.md, "Every promise has an owner"),
and `i18n-railtie-initializers-unported` cannot wire its two hooks.
`runLoadHooks` has ~54 callers, so making it uniformly async is a cascade.

## Acceptance criteria

- The `before_eager_load` and `after_initialize` hooks a railtie registers can do async work
  that the finisher awaits, in registration order, before the next initializer runs
  (decide the shape: an awaited run at these two finisher sites, or an async `runLoadHooks`
  cascade).
- No hook promise is dropped; `pnpm parity:promises` stays green.
- Unblocks `i18n-railtie-initializers-unported`.
