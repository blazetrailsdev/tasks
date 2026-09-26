---
title: "Authentication generator's skipActionCable replaces defined?(ActionCable::Engine)"
status: done
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 4
pr: trails#8131
claim: "2026-09-26T02:32:09Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: null
closed-reason: null
---

## Context

Rails templates the Action Cable connection only when the engine is loaded:
`template "app/channels/application_cable/connection.rb" if defined?(ActionCable::Engine)`
(`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:20`),
and its test removes the constant to exercise the skip
(`railties/test/generators/authentication_generator_test.rb:115-124`).

trails replaces the `defined?` check with an invented constructor option,
`AuthenticationGeneratorOptions.skipActionCable`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`,
`if (this.options.skipActionCable === false)`). It is not a Rails `class_option`,
so `trails generate authentication` cannot reach it, and it is extra surface
with no Rails counterpart.

## Acceptance criteria

- `skipActionCable` is removed. `createAuthenticationFiles` checks whether an
  Action Cable engine is loaded: the call-time check of `defined?(ActionCable::Engine)`,
  e.g. `TopLevel.ActionCable?.Engine !== undefined` per CLAUDE.md § "Call-time constant resolution".
- `connection_class_skipped_without_action_cable` exercises the check the way
  Rails does: unseat the engine, run, assert no `connection` file.
- The tests that emit the channel file (`makeGen({ skipActionCable: false })`)
  seat a stand-in engine instead.
