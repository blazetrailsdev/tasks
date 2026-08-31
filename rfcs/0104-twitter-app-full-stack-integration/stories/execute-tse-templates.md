---
title: "Tse#render throws: no .tse template can execute"
status: done
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 7281
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Tse#render` throws unconditionally on `main`, so no `.tse` template has ever
been executed by the packages:

```ts
// packages/actionview/src/template/handlers/tse.ts:153-157
render(_source: string, _locals: Record<string, unknown>, _context: RenderContext): string {
  throw new Error(
    "Tse#render is not yet implemented — `.tse` execution lands in Phase 2c. " + ...
```

This RFC's "State of play" describes that throw as already fixed. It is not:
the fix lives only on the unmerged branch `twitter-app-full-stack-11518d`
(commit `5fbfe1886`, PR #6470, closed without merging), together with
`examples/twitter-app`. Nothing in `packages/**` on `main` turns a compiled
`.tse` module into an output string, so every downstream story in this RFC that
talks about template scope, helpers, or layouts is unreachable until this
lands.

Rails splits this across `Template#compile!`
(`vendor/rails/actionview/lib/action_view/template.rb` — `mod.module_eval` of
the handler's code string into a real method on the view class, guarded on
`@compiled`) and `Template#render` (calls that method with the view as `self`
and `local_assigns` layered on top).

The substrate this needs already exists on `main`:
`TseRenderContextImpl` (`packages/actionview/src/render-context.ts:114`) with
`outputBuffer` / `capture` / `concat` / `raw` / `yield` / `contentFor`, and the
`TemplateHandler` protocol (`packages/actionview/src/template/handlers.ts:37`).
`LookupContext#renderTemplate`
(`packages/actionview/src/lookup-context.ts:729`) already dispatches to the
handler; it has no way to answer a nested `render partial:` from inside a
compiled template, which Rails gets for free because the template's `self`
IS the `ActionView::Base` that answers `render`.

## Converged shape

- Implement `Tse#render`: compile the emitted module source to a callable
  (`new Function` is the JS analogue of `module_eval`; memoize on the emitted
  code the way Rails memoizes `@compiled`) and invoke it against a
  `TseRenderContext`, returning `outputBuffer.toStr()`.
- Resolve the compiled template's bare identifiers against an object
  environment record carrying the view helpers (`yield`, `render`, `raw`,
  `concat`, `capture`, `contentFor`) with the locals assigned over them, so a
  local shadows a helper exactly as a Ruby block parameter shadows a method.
- Thread a synchronous nested-partial renderer through `RenderContext`
  (`renderPartial?`), supplied by `LookupContext` — the Rails-shape lookup
  (`PartialRenderer#partial_path`'s qualified-name handling) lives there, not
  in the handler.

`5fbfe1886` is a working reference for all three; it is not authoritative on
fidelity and should be re-derived against `template.rb` rather than
cherry-picked wholesale.

Scoped to `actionview` only. The `ActionController::ImplicitRender` half of
`5fbfe1886` is a separate story.

## Acceptance criteria

- `Tse#render` returns the rendered output for a `.tse` source; the throw is
  gone.
- Template locals resolve as bare identifiers, and shadow a same-named helper.
- `<%= yield %>` in a layout emits the inner template's output; named
  `content_for` sections round-trip.
- A `render({ partial: ... })` inside a template resolves through
  `LookupContext`, including a qualified `"users/user"` name, and a nested
  partial inside that partial resolves too.
- A handler whose `render` returns a promise raises rather than emitting
  `[object Promise]` when nested.
- Tests in `packages/actionview/src/template/handlers/tse.test.ts`.
