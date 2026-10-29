---
title: "authentication-generator-hooks-test-unit-authentication"
status: ready
updated: 2026-10-29
rfc: "0171-thor-port"
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

`Rails::Generators::AuthenticationGenerator` ends with `hook_for :test_framework`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/authentication_generator.rb:55`),
which invokes `TestUnit::Generators::AuthenticationGenerator#create_user_test_files`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/authentication/authentication_generator.rb`):
`template "test/fixtures/users.yml"` and `template "test/models/user_test.rb"`, from
`test_unit/authentication/templates/test/{fixtures/users.yml.tt,models/user_test.rb.tt}`.

trails' `AuthenticationGenerator` (`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`)
registers its Rails commands and the `templateEngine` hook (trails#9399), but omits the
`testFramework` hook, because there is no `packages/trailties/src/generators/test-unit/authentication/`
generator for it to resolve to. Adding the hook alone would print `error test_unit [not found]`.

## Acceptance criteria

- [ ] `packages/trailties/src/generators/test-unit/authentication/authentication-generator.ts` ports
      `TestUnit::Generators::AuthenticationGenerator` (`< Rails::Generators::Base`) with
      `create_user_test_files` registered as its command, writing a TS user fixture and model test
      ported from the two `.tt` templates.
- [ ] `AuthenticationGenerator.hookFor("testFramework")` is declared after `addMigrations`, as in Rails.
- [ ] The authentication generator test asserts the two files, as
      `vendor/rails/v8.0.2/railties/test/generators/authentication_generator_test.rb` does.
