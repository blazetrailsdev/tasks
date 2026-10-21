---
title: "build-views precompiles templates of every registered handler, not only .tse"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 6
pr: trails#9196
claim: "2026-10-21T21:15:05Z"
assignee: "build-views-precompiles-every-registered-handler"
blocked-by: null
closed-reason: null
---

## Context

After trails#9149, `Template#compile` (`packages/actionview/src/template.ts`) loads a file-backed template's method from the module `build-views` emits, and `build-views` (`packages/trails-tsc/src/build-views.ts`) emits modules only for `.tse` files. A file-backed template under any other registered handler (`Raw`, `Html`, the `ruby` handler registered in `Template`'s static block, a user handler) has no compiled module, so in shipped code it raises `LoadError`. Rails compiles every handler's output the same way: `compiled_source` calls `@handler.call(self, source)` for whatever handler the template has (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:443-486`), then `compile` does `module_eval` (`:500-539`). Raw is `Template::Handlers::Raw#call` (`template/handlers/raw.rb`), Html is `template/handlers/html.rb`. Today those handlers run only through the test compiler's `new Function` path (`packages/actionview/src/test-helpers/compile-template.ts`).

## Acceptance criteria

- `build-views` emits a runtime module (with a source map) for every file whose extension names a registered handler, not only `.tse`. The method body is the handler's `call` output, built at build time.
- A file-backed `.html` / `.raw` template renders in shipped code with no eval.
- The test compiler's non-TSE `with` + `new Function` branch is deleted. Tests compile non-TSE handlers through the same build path.
- Tests: a file-backed raw template and a file-backed html template render from their emitted modules.
