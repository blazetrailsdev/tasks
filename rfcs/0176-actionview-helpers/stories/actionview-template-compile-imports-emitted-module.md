---
title: "actionview-template-compile-imports-emitted-module"
status: closed
updated: 2026-10-20
rfc: "0176-actionview-helpers"
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
closed-reason: "DUPLICATE: absorbed into its parent story actionview-template-compile-loads-precompiled-module, shipped whole in trails#9149"
---

## Context

Split from `actionview-template-compile-loads-precompiled-module`, whose PR shipped the build half: `packages/trails-tsc/src/build-views.ts` now emits `<rel>.tse.js` + `.js.map` beside each `.tse.ts` stand-in, for every `.tse` file (partials and unused templates included). Nothing in actionview reads it yet.

Repo-owner rulings: file-backed `.tse` templates are precompiled in every environment (2026-10-19); no eval pipeline in shipped code, run-time compilation only in test code (2026-10-20).

- Rails: `Template#compile` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:500-502`) is `mod.module_eval(compiled_source, identifier, offset)`; `compile!` at `:418`, `compiled_source` at `:443`.
- trails: `packages/actionview/src/template.ts` `compile` `(0, eval)`s `compiledSource()`, which nests four sloppy-mode `with` blocks (`TopLevel`, `this`, `__yield`, locals). `compileBang` and `compile` are sync today; `render` already awaits, so `compileBang` must become awaited.
- Emitted module shape: `export default async function render(this: View, context, locals, _)` (`packages/trails-tsc/src/plugins/tse.ts` `virtualizeTseWithDeltas`). The compiled method seated on `mod._compiledMethods` must adapt `(localAssigns, outputBuffer, __kwargs, _)` to it, and strict-locals `parameters` (used by `compile`'s non-keyword check) must be carried by the module or re-derived from the signature.
- Non-TSE handlers (`Html`, `Raw`, builder) also return JS source today; decide their precompiled form.
- Test helper model: `packages/trailties/src/template-builder/testing.ts` (`transpileModule`). The stand-in builder lives in trails-tsc, which depends on actionview, so the helper must avoid a runtime package cycle.

## Acceptance criteria

- Root CLAUDE.md section "Templates are precompiled (`Template#compile`'s `module_eval`)": `compileJs` is the Erubi step, the typed stand-in is `compiled_source`, `tsc` is the compiler; shipped code has no eval pipeline. Code cites it.
- `Template#compile` keeps its Rails name and call site; it loads the emitted module through an awaited `import()` (the `rbFLoad` shape) and seats the method on `mod._compiledMethods`. A missing compiled module raises.
- `compiledSource()`'s `with` chain and `compile`'s `(0, eval)` are deleted. No `eval`, `new Function` or `vm` in actionview or tse-compiler shipped `src/`; a guard test fails on one.
- String-source templates (`Template::Inline`, `render inline:`, `Template.new` from a string) raise in shipped code with a named error class and message citing the section.
- An actionview test helper (not the main export) compiles a string-source template via the same stand-in + `transpileModule` and evaluates it; test setup installs it.
- Tests: file-backed render runs the emitted module; missing build raises; inline render raises in shipped code; with the helper installed an inline render works.
