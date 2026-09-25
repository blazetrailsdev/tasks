---
title: "port-the-tse-authentication-views-generator"
status: draft
updated: 2026-09-25
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

Rails' authentication generator emits its views through the template engine,
not itself: `hook_for :template_engine, as: :authentication`
(`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:9-11`)
invokes `Erb::Generators::AuthenticationGenerator`, which templates
`app/views/sessions/new.html.erb`, `app/views/passwords/new.html.erb` and
`app/views/passwords/edit.html.erb`
(`railties/lib/rails/generators/erb/authentication/templates/app/views/`).

trails' `AuthenticationGenerator`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`)
has no `hook_for :template_engine` arm and there is no TSE authentication
generator, so a generated app has `SessionsController#new` /
`PasswordsController#new` / `#edit` (empty bodies, implicit render, #8107) but
no `sessions/new.html.tse` / `passwords/{new,edit}.html.tse` for them to render —
`MissingExactTemplate` on a browser GET.

## Acceptance criteria

- A TSE authentication generator ports `erb/authentication/authentication_generator.rb`
  and its three templates to `.tse`.
- `AuthenticationGenerator` invokes it unless `--api`, as the `hook_for` block does.
- The generator test asserts the three views exist (and are absent under `--api`).
