---
title: "trails-tsc: a template local named like a global (global) types as globalThis"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trails-tsc/lib/plugins/tse.ts:367`: a view's `Scope<K>` falls through
to `(typeof globalThis)[K]` when `K` is not in `ObjectLocals` (which is `{}`
for controller-rendered views), the View, or TopLevel. A render local named
`global` therefore types as Node's `globalThis` as soon as `@types/node` is in
the program. trailmap#150 hit this: adding happy-dom (a dev dep that brings
`@types/node`) turned `for (const row of global)` in
`app/views/repo-settings/show.html.tse` into TS2488. The fix there was renaming
the local, but any app with a local named like a global (`global`, `name`,
`status`, `event`, `location`) gets a wrong type with no error at the render.

## Acceptance criteria

- A local the controller passes in `render({ locals })` (or that the template
  only reads) types as `any` or as its passed type, never as a `globalThis` member.
- A trails-tsc test renders a view with a local named `global` with
  `@types/node` loaded, and the view typechecks.
