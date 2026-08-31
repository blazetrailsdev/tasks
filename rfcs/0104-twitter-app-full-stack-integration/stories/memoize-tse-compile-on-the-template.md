---
title: "The .tse compile memo is a global Map, where Rails memoizes @compiled per Template"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview"]
deps: ["execute-tse-templates"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails memoizes a template's compile ON THE TEMPLATE: `compile!`
(`vendor/rails/actionview/lib/action_view/template.rb:418-438`) returns early on
`@compiled` and sets it under `@compile_mutex`, so the memo is one boolean per
`Template` instance and dies with it.

`Tse#render` (`packages/actionview/src/template/handlers/tse.ts`, PR #7281)
cannot: the handler protocol
(`packages/actionview/src/template/handlers.ts`, `TemplateHandler#render`)
hands it `(source, locals, context)` and no `Template`, so the memo went to a
module-level `Map` keyed on the emitted code:

```ts
const compiledCache = new Map<string, CompiledTemplate>();
```

That is correct for the fixed, ahead-of-time template set an app has, and wrong
in two ways next to Rails: it is process-global rather than per-instance, and
nothing evicts it, so a dynamically-generated `.tse` source accumulates a
compiled function for the process lifetime. Surfaced in review of #7281.

`Template#render` (`packages/actionview/src/template.ts:127`) is the natural
owner — it already holds the instance Rails memoizes on, and already ports
`handle_render_error` (`template.rb:549-556`) around the same call.

## Converged shape

Move the compile memo onto `Template`, so it is per-instance and GC'd with the
template the way `@compiled` is, and delete the module-level `Map`. That means
the handler has to be reachable with the template in hand — either by threading
the `Template` through `RenderContext`, or by `Template#render` owning the
compile step and handing the handler a compiled callable.

Related: `helper-methods-not-in-tse-scope`, which replaces the handler's scope
object with a real view object and revisits the same protocol seam.

## Acceptance criteria

- No module-level compiled-template cache survives in
  `packages/actionview/src/template/handlers/tse.ts`.
- Two `Template` instances over the same source do not share a memo entry, and
  a discarded `Template` leaves nothing retained.
- Re-rendering one `Template` still compiles once.
- The `@compiled` guard's early-return shape matches `template.rb:418-438`.
