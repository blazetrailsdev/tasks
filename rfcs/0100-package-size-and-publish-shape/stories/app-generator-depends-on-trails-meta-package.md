---
title: "App generator depends on the @blazetrails/trails meta-package, as Gemfile.tt depends on rails"
status: claimed
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 7
pr: null
claim: "2026-11-23T18:59:09Z"
assignee: "first-alpha-practice-publish"
blocked-by: null
closed-reason: null
---

## Context

Rails' app generator writes one `gem "rails"` line into the Gemfile
(`vendor/rails/v8.0.5.2/railties/lib/rails/generators/app_base.rb`, `rails_gemfile_entry`;
template `railties/lib/rails/generators/rails/app/templates/Gemfile.tt`), and the
`rails` meta-gem pulls in every framework (`vendor/rails/v8.0.5.2/rails.gemspec:32-43`).
`--skip-*` flags change only which frameworks are `require`d in
`config/application.rb`, not which gems are installed.

trails#10634 added `@blazetrails/trails`, the meta-package, but
`packages/trailties/lib/generators/app-base.ts` `TRAILS_PACKAGES` (~line 970-991)
and `trailsPackageEntry` still emit one dependency per framework, filtered by
`--skip-*`.

## Converged shape

`trailsPackageEntry` emits a single `@blazetrails/trails` entry (version / path /
github arms as today), as `rails_gemfile_entry` emits `gem "rails"`. Packages that
are not in `rails.gemspec` (`activerecord-cli`, `trails-tsc`, solid\_\*, rackup) stay
separate entries as Rails' Gemfile.tt lists them separately. Update
`app-generator.trails.test.ts` "without --dev keeps the version entries" to
assert the single entry.

## Acceptance criteria

- A generated app's `package.json` depends on `@blazetrails/trails`, not on each
  framework package.
- `--skip-*` still drops the framework's `import` in `config/application.ts`.
- `--dev` links `@blazetrails/trails` to the local checkout.
