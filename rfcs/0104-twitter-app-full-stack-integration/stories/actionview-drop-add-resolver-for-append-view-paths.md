---
title: "actionview-drop-add-resolver-for-append-view-paths"
status: draft
updated: 2026-08-31
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

`LookupContext#addResolver` (`packages/actionview/src/lookup-context.ts`) has no
Rails counterpart. It exists only because trails grew a second resolver
protocol before `PathSet` was ported; the resolver-protocol unification PR
turned it into a one-line alias for `appendViewPaths`, Rails'
`append_view_paths` (`vendor/rails/actionview/lib/action_view/view_paths.rb:87-89`).

The remaining work is to delete the alias and have every caller say
`appendViewPaths` (or `ViewPaths#appendViewPath`) directly.

Callers today:

- `packages/actionview/src/lookup-context.test.ts`
- `packages/actionview/src/digestor.test.ts`
- `packages/actionview/src/view-paths.trails.test.ts`
- `packages/actionview/src/template/resolver.trails.test.ts`
- `examples/twitter-app` and the trailties dev server, if they still call it

## Acceptance criteria

- `addResolver` is gone from `LookupContext`, along with its
  `@noRailsEquivalent` receipt.
- Every caller uses `appendViewPaths` / `appendViewPath`.
- `pnpm parity:api:extra --package actionview` reports one fewer novel name.
