---
title: "actionpack-dist-entry-tdz-on-helper-method-builder"
status: in-progress
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8203
claim: "2026-09-27T23:57:35Z"
assignee: "abstract-normalize-render-self-dispatches-process-variant"
blocked-by: null
closed-reason: null
---

## Context

A plain-node import of the built actionpack entry fails:

```text
$ cd packages/actionpack && node -e "import('./dist/index.js')"
ReferenceError: Cannot access 'HelperMethodBuilder' before initialization
```

Found on trails#8198 while running the CLAUDE.md § "Call-time constant resolution"
check (plain-node import of built `dist/**.js` entry modules). Removing that PR's
only actionpack change, a `RouteWrapper` re-export from
`action-dispatch/routing/index.ts`, does not change the failure. So it already
exists on main, and every trailties entry that reaches actionpack
(`dist/cli.js`, `dist/engine.js`, `dist/info-controller.js`, …) fails the same way.
Vitest enters the funnel module first and masks it.

`HelperMethodBuilder` is re-exported from `action-dispatch/routing/index.ts`
(`polymorphic-routes`), and `ActionDispatch::Routing::PolymorphicRoutes::HelperMethodBuilder`
is Rails' `actionpack/lib/action_dispatch/routing/polymorphic_routes.rb`.

## Acceptance criteria

- `node -e "import('./dist/index.js')"` in `packages/actionpack` succeeds, and so does
  `packages/trailties/dist/cli.js`.
- The cycle is broken with the § "Call-time constant resolution" shape (the
  `ActionDispatch` Autoload namespace), not a new slot.
- A regression check imports the built entry under plain node.
