---
title: "trails-internal-controllers-not-loaded-at-boot"
status: ready
updated: 2026-11-26
rfc: "0247-website-refresh"
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

`packages/trailties/lib/application/finisher.ts`'s `eager_load!` initializer carries an `@inventedArm for` loop (added in trails#10520) that awaits `Trails.loadPath[...]` for every `Trails._autoloads` entry on every boot, whatever `config.eager_load` says. Rails' `eager_load!` (`vendor/rails/v8.0.5.2/railties/lib/rails/application/finisher.rb:76-90`) loads nothing when `eager_load` is false, and `rails.rb:30-37` autoloads `MailersController` lazily.

The effect: every app, including the browser playground (`examples/browser-sqlite`, which loads no actionmailer railtie), imports `trails/mailers_controller` and with it `@blazetrails/actionmailer` and `@blazetrails/mail` at boot: 1.66MB raw / 150KB gzip of the playground's download (measured on trails#10753's tree, CDP initiator stack `trails/mailers_controller@trails-*.js`).

## Acceptance criteria

- The autoloaded internal controllers load where Rails resolves them (on the first route dispatch that names them, or under `eager_load`), not unconditionally at boot.
- The playground's boot no longer fetches the mailers chunk.
