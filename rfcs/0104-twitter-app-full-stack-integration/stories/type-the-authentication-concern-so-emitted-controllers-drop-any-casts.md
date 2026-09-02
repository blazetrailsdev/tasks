---
title: "Emitted auth controllers cast to any at every concern call site"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `include Authentication` puts the concern's methods on the including
class, so `sessions_controller.rb.tt:9` calls `start_new_session_for user` and
`after_authentication_url` as plain receivers-less methods
(`railties/lib/rails/generators/rails/authentication/templates/app/controllers/sessions_controller.rb.tt:8-16`).

trails' module-mixin convention (`include()` / `Included<>` from
`@blazetrails/activesupport`, CLAUDE.md "Module mixins") installs them at
runtime but does not widen the including class's TYPE. So the authentication
generator's emitted controller has to cast at every concern call site
(`packages/trailties/src/generators/rails/authentication/templates.ts`, the
`app/controllers/sessions_controller.rb` entry):

```ts
await (this as any).startNewSessionFor(user);
this.redirectTo((this as any).afterAuthenticationUrl());
```

and the same for `terminateSession` and for the `ClassMethods` half,
`(this as any).allowUnauthenticatedAccess({ only: ["new_", "create"] })`.

Every one of those casts is a place a generated app loses type-checking on code
trails itself wrote, and it is the shape any app author copying the generator's
output will imitate. `Included<>` exists precisely to express this at the type
level; the emitted templates predate its use here and the concern is built with
`defineModule` whose private section has no type-level surface.

## Acceptance criteria

- The emitted `Authentication` concern exposes its instance methods and its
  `ClassMethods` half through `Included<>` / `Extended<>` (or the settled
  successor), so the generated `SessionsController` and `PasswordsController`
  call them directly.
- No `(this as any)` remains in any emitted template.
- `defineModule`'s private section carries whatever type-level surface this
  needs, or the concern is restructured to a shape that does — without losing
  the Ruby `private` semantics it encodes.
- The generator's snapshot test covers the cast-free output.
