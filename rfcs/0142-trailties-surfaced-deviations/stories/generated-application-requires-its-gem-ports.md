---
title: "trailties: a generated app loads its gem ports through a Bundler.require analogue, not per-generator imports"
status: draft
updated: 2026-10-03
rfc: "0142-trailties-surfaced-deviations"
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

A Rails app loads its gems through `Bundler.require(*Rails.groups)` in
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/application.rb.tt`.
Every gem in the Gemfile that isn't `require: false` is required at boot. trails' generated
`config/application.ts` (`packages/trailties/src/generators/app-generator.ts`, `createConfigFiles`)
only has `import "@blazetrails/trailties/all";`, which covers the framework. Nothing loads the
app's other gem ports.

trails#8431 worked around this for one gem. `AuthenticationGenerator#enableBcrypt`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`) inserts
`import "@blazetrails/bcrypt";` after that line, because `has_secure_password` now raises
`LoadError` unless `TopLevel.BCrypt` is seated. Rails' `enable_bcrypt`
(`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:41-48`) edits only
the Gemfile and leaves loading to `Bundler.require`.

## Acceptance criteria

- [ ] The generated app has one `Bundler.require` analogue that loads the gem ports listed in its `package.json` dependencies (the Gemfile analogue), placed where `application.rb.tt` calls `Bundler.require`.
- [ ] `enableBcrypt` stops editing `config/application.ts` and only adds `@blazetrails/bcrypt` to the dependencies, as `enable_bcrypt` only edits the Gemfile. It also drops the redundant direct `bcryptjs` entry, which the gem port already depends on.
- [ ] The `authentication-generator.trails.test.ts` enable_bcrypt case asserts the dependency, and a generated app with `hasSecurePassword` boots without `LoadError`.
