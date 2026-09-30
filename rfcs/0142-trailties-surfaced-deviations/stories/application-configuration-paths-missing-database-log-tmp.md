---
title: "Application::Configuration#paths: seat config/database, log, tmp and memoize like @paths ||="
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

Rails' `Application::Configuration#paths`
(`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:396-409`) is a
`@paths ||= begin paths = super; paths.add ...; paths end` memo that adds, in order:
`config/database` (with `config/database.yml`), `config/environment`,
`lib/templates`, `log` (with `log/#{Rails.env}.log`), `public`,
`public/javascripts`, `public/stylesheets`, `tmp`.

trails' override (`packages/trailties/src/application/configuration.ts`,
`override paths()`) seats only `config/environment`, `lib/templates`, `public`,
`public/javascripts`, `public/stylesheets` (the last two added by trails#8264).
It also wraps each `add` in an `if (!paths.get(...))` guard. The guards exist because
the method re-runs on every call and adds to the memoized `Root` from
`Engine::Configuration#paths`, rather than keeping its own `@paths ||=` memo.

## Acceptance criteria

- `config/database` (`with: "config/database.yml"` or the trails-renamed equivalent),
  `log` (`with: log/<env>.log`) and `tmp` are added in the Rails positions.
- The override memoizes like Rails' `@paths ||=` and drops the per-entry
  `if (!paths.get(...))` guards, so each entry is added exactly once in Rails order.
- Test: the key order of `config.paths()` matches configuration.rb:399-406.
