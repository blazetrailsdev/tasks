---
title: "trails new: hotwire gems missing and turbo/stimulus/solid-cache/solid-cable install tasks unrecognized"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
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

Sibling of `app-generator-javascript-gemfile-entry-loads-vite-trails`. On 2026-11-21, `trails new blog` (trails#10547's broadcast check) ran
`turbo:install stimulus:install` and `solid_cache:install solid_queue:install solid_cable:install`, and each answered
`Unrecognized command`, except `solid_queue:install`. The generated `package.json` lists `@blazetrails/solid-cache`, `solid-queue` and `solid-cable` but not
`@blazetrails/turbo` / `@blazetrails/stimulus`, and the solid_cache / solid_cable install tasks are not registered.
Rails adds the hotwire gems through `hotwire_gemfile_entry` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`)
and runs `turbo:install stimulus:install` and `solid_cache:install solid_queue:install solid_cable:install`, all of which resolve once `Bundler.require` loads the gems.
(The command names also stay snake_case here: `solid_cache:install` should be `solid-cache:install` per the Node-casing ruling.)

## Acceptance criteria

- The generated `package.json` lists `@blazetrails/turbo` and `@blazetrails/stimulus` unless `--skip-hotwire`.
- `bin/trails turbo:install`, `stimulus:install`, `solid-cache:install` and `solid-cable:install` are recognized in a freshly generated app.
- `trails new` completes end to end in a workspace checkout.
