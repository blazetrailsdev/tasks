---
title: "drain-queued-generators-in-generators-invoke"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `generate` action (`railties/lib/rails/generators/actions.rb`) shells
out to `bin/rails generate`, so a generator that calls `generate "migration
CreateUsers ..."` (`rails/generators/rails/authentication/authentication_generator.rb:52-55`)
has the migration on disk by the time it returns.

trails' port only queues the request:

```ts
// packages/trailties/src/generators/actions.ts:22-29
export function generate(
  this: ActionsHost & GeneratorActionsState,
  what: string,
  ...args: string[]
): void {
  this.output(`      generate  ${what}`);
  this.pendingGenerators.push({ what, args });
}
```

and the only drain loop in the repo is in the `app:template` command
(`packages/trailties/src/commands/app.ts:24-28`). `Generators.invoke`
(`packages/trailties/src/generators.ts:149-167`) returns `klass.start(...)`,
which hands back the created-file list and drops the instance — so nothing
queued by a generator invoked through `trails generate <name>` ever runs.

`AuthenticationGenerator#runPendingGenerators`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`,
tagged `@noRailsEquivalent CONVERGEABLE` against this story) is a per-generator
workaround for exactly that gap, and it only understands `"migration"`.

## Acceptance criteria

- Queued `generate` requests are drained once, centrally — the natural seat is
  `Generators.invoke`, which would need the instance `start` currently hides.
- The drain dispatches by namespace through `Generators.invoke`, not a
  hard-coded generator list.
- `AuthenticationGenerator#runPendingGenerators` is deleted and its
  `@noRailsEquivalent` receipt with it; its test
  ("emits create_users and create_sessions migrations") still passes.
- `app:template`'s own drain loop is folded into the same path or left as the
  one deliberate caller, whichever the shape allows.
