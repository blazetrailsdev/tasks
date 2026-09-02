---
title: "port-execute-command-as-a-generator-action"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
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

Rails' `execute_command` is a private instance method of
`Rails::Generators::Actions`
(`railties/lib/rails/generators/actions.rb:461-472`), so every generator that
includes the module can call it:

```ruby
def execute_command(executor, command, options = {})
  ...
  in_root { run("#{sudo}#{Shellwords.escape Gem.ruby} bin/#{executor} #{command}", config) }
end
```

`AuthenticationGenerator#enable_bcrypt` uses it twice —
`execute_command :bundle, "install --quiet"` and
`execute_command :bundle, "add bcrypt"`
(`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:41-47`) —
and `rake` / `rails_command` are the other callers.

trails ported it as a **file-local function** instead:
`executeCommand(host, executor, command, options)` in
`packages/trailties/src/generators/actions.ts:72`, not exported and not assigned
onto `GeneratorBase`. Its only caller is `rake` (`actions.ts:69`). A generator
subclass therefore cannot reach it, which is why
`AuthenticationGenerator#enableBcrypt` carries a
`@missingRailsCall execute_command` receipt pointing at this story.

Two things have to be settled together:

- **Reachability.** `executeCommand` should be a host method like Rails' private
  one, so `enableBcrypt` and any future generator can call it. `GeneratorBase`
  already assigns the public actions (`generate`, `git`, `rake`,
  `afterInstall`); the private half has no seat.
- **What `:bundle` is.** Rails runs `bin/#{executor}`, i.e. `bin/bundle`. A
  trails app has no `bin/` package-manager stub, and which manager to invoke
  (pnpm / npm / yarn) is not knowable from the generator. `pkg`
  (`trails-actions.ts:46`) deliberately only edits `package.json`, and
  `actions.ts:1-8` records the decision that the Gemfile-shaped actions do not
  port. Whether the install runs at all — immediately, or queued onto
  `afterInstall` (Rails' `after_bundle`) — is the open question this story
  answers.

Note `afterInstallCallbacks` has the same drain gap as `pendingGenerators`
(see `drain-queued-generators-in-generators-invoke`): nothing outside
`AppGenerator` runs it, so queuing onto it today is a no-op.

## Acceptance criteria

- `executeCommand` is reachable from a generator subclass the way Rails'
  private `execute_command` is, with Rails' parameter names and option keys.
- The package-manager question is settled explicitly — either a resolved
  executor with a stated detection rule, or a recorded decision that trails
  never installs from a generator, in which case the `@missingRailsCall` on
  `enableBcrypt` is re-cut as `PERMANENT` with that decision cited.
- `AuthenticationGenerator#enableBcrypt` either calls it or carries the
  re-cut receipt; the `CONVERGEABLE` tag pointing at this story is gone either
  way.
- `rake`'s existing behavior and tests are unchanged.
