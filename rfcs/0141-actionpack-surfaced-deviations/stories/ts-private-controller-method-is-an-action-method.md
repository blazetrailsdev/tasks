---
title: "actionpack: a controller method declared TypeScript-private is an action method (abstract_controller/base.rb:77-107)"
status: draft
updated: 2026-10-08
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found building trailmap#45. A controller method declared with TypeScript's `private` is an action
method: `private` is erased at compile time, and `AbstractController.actionMethods`
(`packages/actionpack/src/abstract-controller/base.ts:218`) enumerates every method on the prototype
chain through `allPublicMethodNames` (`base.ts:22`).

Probe, run in trailmap against the vendored build (trails pin c83105fc59):

```ts
class ProbeController extends ApplicationController {
  async show(): Promise<void> {}
  private async helperThing(): Promise<void> {}
}
ProbeController.actionMethods(); // includes "helperThing"
```

In Rails, `action_methods` is `public_instance_methods(true) - internal_methods`
(`actionpack/lib/abstract_controller/base.rb:77-107`), so a `private def` helper is never an action
and `available_action?` refuses it.

What it forced in trailmap: `FleetController` needed a helper shared by two actions. Writing it as a
`private` method would have made it an action, so it became a module-level function instead
(`ringoFailure` in `app/controllers/fleet-controller.ts`). That is the workaround; this story is the
finding.

Related, not the same: `action-methods-does-not-subtract-internal-methods` is about the
`internal_methods` half of the same expression.

## Expected shape

A controller author has one documented way to write a non-action helper method on a controller, and
`actionMethods()` / `isAvailableAction()` exclude it. Either the enumeration honours whatever trails
already uses to mark a method private (`#private` names, a registry, `@internal`), or `trails g
controller` and the guides say which spelling to use. A `private`-keyword method silently becoming a
routable action under a dynamic `:action` segment is the outcome to remove.

## Acceptance criteria

- A test in actionpack pins that a controller's private helper, in the spelling trails blesses, is
  absent from `actionMethods()` and refused by dispatch.
- The blessed spelling is documented where a controller author will read it.
- If the TypeScript `private` keyword cannot be honoured at runtime, that is stated at the call site
  as a deviation, per trails' CLAUDE.md.
