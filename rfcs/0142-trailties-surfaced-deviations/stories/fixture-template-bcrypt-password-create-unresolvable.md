---
title: "fixture-template-bcrypt-password-create-unresolvable"
status: draft
updated: 2026-09-30
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

`fixtures.yml.tt`'s `password_digest?` arm
(`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/model/templates/fixtures.yml.tt:6-7`)
emits `password_digest: <%= BCrypt::Password.create("secret") %>`, and the authentication
generator's `test_unit/authentication/templates/test/fixtures/users.yml.tt:1` does the same with
`"password"`. In Rails the fixture ERB is evaluated with the bcrypt gem loaded, so the call resolves.

trails' port (`packages/trailties/src/generators/test-unit/model/templates.ts`) emits the JS
spelling `<%= BCrypt.Password.create("secret") %>`, but trails has no `BCrypt::Password` port:
`packages/activemodel/src/bcrypt.ts` exports only `Engine` (cost constants), and
`secure-password.ts` calls `bcryptjs` directly. The fixture TSE context
(`activerecord/src/fixture-set/file.ts` → `ConfigurationFile.parse(..., { context })`,
`activesupport/src/configuration-file.ts:59-80`, a `new Function` over the context names)
does not have `BCrypt` in scope. So `generate model User password:digest` writes a fixture
that throws `ReferenceError: BCrypt is not defined` when it loads.

## Acceptance criteria

- [ ] `BCrypt::Password.create` (bcrypt-ruby `lib/bcrypt/password.rb`) is ported over `bcryptjs` next to `activemodel/src/bcrypt.ts`, where `has_secure_password` reaches it.
- [ ] It is reachable as `BCrypt` from a fixture's `<%= %>` the way the gem constant is from Rails' ERB.
- [ ] `generate model User password:digest` followed by loading `test/fixtures/users.yml` gives a row whose `password_digest` authenticates `"secret"`.
