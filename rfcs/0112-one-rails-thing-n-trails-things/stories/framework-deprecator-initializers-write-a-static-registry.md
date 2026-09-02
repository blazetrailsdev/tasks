---
title: "Framework .deprecator initializers write a static registry instead of app.deprecators"
status: ready
updated: 2026-09-02
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `<framework>.deprecator` initializers write through the app they are
yielded:

- `activerecord/lib/active_record/railtie.rb:79` —
  `initializer "active_record.deprecator", before: :load_environment_config do |app| app.deprecators[:active_record] = ActiveRecord.deprecator end`
- `activesupport/lib/active_support/railtie.rb:12` — same shape for
  `:active_support`.
- `vendor/globalid/lib/global_id/railtie.rb:46` — same for `:globalid`.

`Rails::Application#deprecators` (`railties/lib/rails/application.rb:244-248`)
is the `ActiveSupport::Deprecation::Deprecators` collection those writes land
in, and its configuration methods then affect every deprecator in it
(`deprecation/deprecators.rb`).

Every trails framework railtie writes a module-level static instead:
`Trailtie.deprecators["activeRecord"] = deprecator()`
(`packages/activerecord/src/trailtie.ts`, and the same line in activemodel,
globalid, actionview, actionpack's two, and
`trailties/src/trailties/active-support.ts`). `Trailtie.deprecators` is a plain
`Partial<Record<string, Deprecation>>` on
`packages/activesupport/src/trailtie.ts`, not a `Deprecators`.

PR #7375 added `Application#deprecators` and made it top up from that static
registry on every read, so the app does see them — but the write direction is
still inverted, and the registry is global, so two apps in one process share
one bag.

## Converged shape

Each `<framework>.deprecator` initializer takes the yielded app and writes
`app.deprecators.set("activeRecord", deprecator())`. The app parameter is
already plumbed (`initializable.rb:31-33`, `:60-63`; trails'
`Initializer#run`). The framework packages need a structural type for the slot
— `globalid/src/trailtie.ts`'s `TrailtieApp` is the existing precedent — since
they cannot import `Application`. `Trailtie.deprecators` and the top-up loop in
`Application#deprecators` then both delete.

## Acceptance criteria

- [ ] Every `<framework>.deprecator` initializer writes `app.deprecators`.
- [ ] `Trailtie.deprecators` (`packages/activesupport/src/trailtie.ts`) is
      deleted, along with the top-up loop in `Application#deprecators`.
- [ ] `trailties/src/trailties/active-support.ts`'s
      `active_support.deprecation_behavior` reads the app's collection rather
      than `Object.values(Trailtie.deprecators)`.
- [ ] Two applications in one process do not share deprecators.
- [ ] Existing `RailtieTest` cases in each package keep their names.
