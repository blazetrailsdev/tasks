---
title: "trailties: enable_bcrypt adds the bcrypt gem port and a generated app loads it"
status: draft
updated: 2026-10-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
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

## Progress

trails#8431 landed the first two criteria: `enableBcrypt`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts:101-125`)
adds `@blazetrails/bcrypt` to `package.json` and inserts `import "@blazetrails/bcrypt";`
into the generated `config/application.ts`. What remains is that it still adds the
`bcryptjs` npm client beside it (`:106-107`), which Rails' `enable_bcrypt` has no analogue
for, and the test still asserts on `bcryptjs`.

## Acceptance criteria

- [ ] `enableBcrypt` adds only `@blazetrails/bcrypt` (the gem port, which depends on its own
      client), as Rails adds only `gem "bcrypt"` (`authentication_generator.rb:41-48`).
- [ ] `authentication-generator.test.ts:182` ("adds bcryptjs to the application's dependencies
      and installs it") asserts on `@blazetrails/bcrypt`; the test name is kept verbatim.
- [ ] The generic loading of app gem ports is `generated-application-requires-its-gem-ports`,
      not this story.
