---
title: "trailties: enable_bcrypt adds the bcrypt gem port and a generated app loads it"
status: draft
updated: 2026-10-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`has_secure_password` now reads the bcrypt gem port at call time (`TopLevel.BCrypt`, seated by
`packages/bcrypt/src/index.ts`) and raises `LoadError("cannot load such file -- bcrypt")` when it is
unseated, as `vendor/rails/v8.0.2/activemodel/lib/active_model/secure_password.rb:120-125` does.
activemodel no longer imports `@blazetrails/bcrypt`, so something in the app has to load it.

In Rails that is the Gemfile: `AuthenticationGenerator#enable_bcrypt`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/authentication_generator.rb:41-48`)
uncomments `gem "bcrypt"` or runs `bundle add bcrypt`, and `Bundler.require` makes the gem
loadable. trails' `enableBcrypt` (`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`)
adds the `bcryptjs` npm client to `package.json` instead, and nothing in a generated app imports
`@blazetrails/bcrypt`. A generated app whose `User` calls `hasSecurePassword` therefore raises
`LoadError` at class definition.

## Acceptance criteria

- [ ] `enableBcrypt` adds `@blazetrails/bcrypt` (the gem port) to the generated app's dependencies, as Rails adds `gem "bcrypt"`.
- [ ] The generated app loads the gem port before its models are defined (the app's analogue of `Bundler.require(*Rails.groups)` in `config/application.rb`), so a generated `User` with `hasSecurePassword` does not raise.
- [ ] `authentication-generator.test.ts`'s "adds bcryptjs to the application's dependencies and installs it" is converged onto the gem port's name, with the Rails test name it mirrors kept verbatim.
