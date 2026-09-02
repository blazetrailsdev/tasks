---
title: "trails generate authentication emits comment bodies, not working code"
status: ready
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps:
  ["has-secure-password-unported", "session-and-flash-lifecycle", "register-generators-by-lookup"]
deps-rfc: []
est-loc: null
priority: 62
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails generate authentication` emits method bodies that are comments. The
output is a shape sketch, not working code — an app that runs it gets a
`SessionsController` whose `create` does nothing.

`packages/trailties/src/generators/rails/authentication/authentication-generator.ts:33-52`
builds every method through local `stub()` / `asyncStub()` helpers whose body
is a comment string:

```ts
this.emit("src/app/controllers/sessions-controller.ts", "SessionsController", APP_CONTROLLER, [
  asyncStub("new_", "// allowUnauthenticatedAccess only: [new_, create]"),
  asyncStub("create", "// User.authenticateBy → startNewSessionFor → redirect"),
  asyncStub("destroy", "// terminateSession → redirect to /session/new"),
]);
```

Emitted verbatim into `examples/twitter-app` before it was replaced by hand:

```ts
export class SessionsController extends ApplicationController {
  async create(): Promise<void> {
    // User.authenticateBy → startNewSessionFor → redirect
  }
}
```

`app/controllers/concerns/authentication.ts` is the same — every method of
the concern (`resumeSession`, `findSessionByCookie`, `startNewSessionFor`,
`terminateSession`) has a comment for a body. Its `includeInto(klass: any)`
shape is also not the repo's module-mixin convention (CLAUDE.md "Module
mixins").

Rails emits complete, working code from real template files:
`vendor/rails/railties/lib/rails/generators/rails/authentication/templates/app/controllers/concerns/authentication.rb.tt`
and `.../app/controllers/sessions_controller.rb.tt`. Rails'
`SessionsController#create` is a full implementation, not a comment.

Two further gaps found at the same time:

- No migration is emitted for the `sessions` table, so the generated
  `Session` model has no table.
- Running the generator silently **overwrites** an existing
  `src/app/models/user.ts`. Rails prompts on conflict
  (`Thor::Actions#create_file` → `conflict` resolution).

## Acceptance criteria

- Every method the generator emits has a working body, ported from the
  corresponding `.tt` template in
  `vendor/rails/railties/lib/rails/generators/rails/authentication/templates/`.
- The `Authentication` concern uses the repo's module-mixin convention
  (`this`-typed functions assigned to the class), not `includeInto(klass: any)`.
- A `create_sessions` migration is emitted.
- An existing file is not silently overwritten.
- Generating into a fresh app and running the resulting sign-up / log-in /
  log-out flow passes an integration test.
