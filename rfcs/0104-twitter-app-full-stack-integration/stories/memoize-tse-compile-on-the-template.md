---
title: "Template does not own compile!: the handler compiles, so @compiled, method_name and handle_render_error are unported"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview"]
deps: ["execute-tse-templates"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Superseded body — the process-global `compiledCache` this story was filed
against is gone (PR #7285). The memo now lives on
`Base#compiledMethodContainer`, which is where Rails puts the compiled
*method* (`base.rb:198-210`). What remains is the other half: `Template` does
not own compilation at all.

Rails splits it:

- `Template#compile!(view)` (`vendor/rails/actionview/lib/action_view/template.rb:418-438`)
  returns early on `@compiled`, takes `@compile_mutex`, and `module_eval`s
  `compiled_source` into `view.compiled_method_container`.
- `Template#compiled_source` (`:443-485`) wraps the handler's code string in
  `def #{method_name}(local_assigns, output_buffer, &_)` with `@virtual_path =`
  and `locals_code` (`:561-572`) prepended.
- `Template#method_name` (`:396-402`) is `_#{identifier_method_name}__#{hash}_#{id}`.
- `Template#render(view, locals, buffer)` (`:271-287`) calls `compile!` then
  `view._run(method_name, self, locals, OutputBuffer.new)`, with
  `handle_render_error` (`:549-556`) as its rescue.

In trails, `Tse#render` (`packages/actionview/src/template/handlers/tse.ts`)
does the compiling: it builds the function, keys it on
`virtualPath + "\0" + code` and stores it in
`container._compiledMethods`. `Template#render`
(`packages/actionview/src/template.ts:127`) still calls `handler.render(source,
locals, ctx)` directly — its own file header says the port "collapses Rails'
compile-then-`module_eval` step into a direct `handler.render` call". So:

- there is no per-`Template` `@compiled` guard, so the key is re-derived and
  looked up on every render;
- `method_name` / `identifier_method_name` are unported, and the cache key
  stands in for them;
- `compiled_source`'s wrapper (and therefore `locals_code` as a named unit)
  lives inside `evaluateTemplate` rather than on `Template`;
- `Template#render` does not take the view and does not call `_run`, so the
  handler has to reach `_run` itself.

`handle_render_error` IS ported (`template.ts:143-155`); it is the one piece of
this cluster that already sits in the right place.

## Converged shape

Move compilation onto `Template`: port `method_name`, `compiled_source`,
`locals_code` and `compile!(view)` per `template.rb:396-485`, with the
`@compiled` early return, and have `Template#render` call `compile!` then
`view._run(...)`. `Tse#call` then goes back to being what Rails'
`Handlers::ERB#call` is — a function from source to a code string — and
`Tse#render` disappears, since the handler protocol's `render` is a trails
invention that exists only because the handler had to execute.

Depends on `template-render-takes-view-before-locals` (RFC 0128), which flips
`Template#render` to Rails' `(view, locals, buffer)` signature, and overlaps
`actionview-render-path-is-async-where-rails-is-sync`.

## Acceptance criteria

- `Template#methodName`, `#compiledSource`, `#localsCode` and `#compileBang`
  match `template.rb:396-402,443-485,418-438,561-572`, including the
  `@compiled` early return.
- `Template#render` calls `compileBang` then `view._run`.
- `Tse#render` and the `TemplateHandler#render` protocol member are gone;
  `Tse#call` remains as the `Handlers::ERB#call` analogue.
- The `view` / `template` fields on `RenderContext` and their
  `@noRailsEquivalent` receipts are gone.
