---
title: "authentication-generator-enable-bcrypt-task"
status: done
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7385
claim: "2026-09-02T14:16:48Z"
assignee: "authentication-generator-enable-bcrypt-task"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AuthenticationGenerator` runs `enable_bcrypt` between route
configuration and migrations
(`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:41-47`):

```ruby
def enable_bcrypt
  if File.read("Gemfile").include?('gem "bcrypt"')
    uncomment_lines "Gemfile", /gem "bcrypt"/
    Bundler.with_original_env { execute_command :bundle, "install --quiet" }
  else
    Bundler.with_original_env { execute_command :bundle, "add bcrypt", capture: true }
  end
end
```

trails' `AuthenticationGenerator.run`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`)
runs `createAuthenticationFiles`, `configureApplicationController`,
`configureAuthenticationRoutes` and `addMigrations`, and has no counterpart to
this task.

The Gemfile half has no analogue — a trails app declares dependencies in
`package.json` — but the `bundle add` half does: `pkg`
(`packages/trailties/src/generators/trails-actions.ts:46`) is documented as
"the trails analogue of railties' `gem` action" and writes the named package
into the app's `dependencies`.

Today the generated `User` model's `hasSecurePassword()` still works, because
`bcryptjs` is an unconditional dependency of `@blazetrails/activemodel`
(`packages/activemodel/package.json:34`, imported at
`packages/activemodel/src/secure-password.ts:1`) and every app gets it
transitively through activerecord. So this is a fidelity gap, not a runtime
break — but Rails makes the password dependency explicit in the app's own
manifest and trails should too.

The blocker is mechanical: `pkg` is async and `AuthenticationGenerator.run` is
sync, so porting the task means making `run` (and the `start` override that
calls it) async and awaiting it across the generator's 12-test suite. That did
not fit inside PR #7385's LOC ceiling alongside its own two stories.

## Acceptance criteria

- `AuthenticationGenerator` gains an `enableBcrypt` task, called from `run`
  between `configureAuthenticationRoutes` and `addMigrations`, matching
  `authentication_generator.rb:41-47`'s position.
- It adds `bcryptjs` through `this.pkg`, the trails analogue of Rails' `gem` /
  `bundle add`; the Gemfile-uncomment arm has no analogue and is not invented.
- `run` and the `start` override become async; the existing 12 tests await it,
  with no test renamed.
- A test asserts the generated app's `package.json` carries `bcryptjs` in
  `dependencies`.
