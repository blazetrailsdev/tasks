---
title: "Templates run tsc-emitted JS from build-views; delete the with-chain eval pipeline"
status: in-progress
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps:
  - tse-stand-in-scope-covers-the-with-chain
deps-rfc: []
est-loc: null
priority: null
pr: trails#9149
claim: "2026-10-20T19:27:20Z"
assignee: "actionview-template-compile-loads-precompiled-module"
blocked-by: null
closed-reason: null
---

## Context

Repo-owner ruling (2026-10-19): file-backed `.tse` templates are precompiled, in every environment. Follow-up ruling (2026-10-20): no eval pipeline anywhere in shipped code. Run-time compilation exists only in test code.

- Rails: `Template#compile` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:500-502`) is `mod.module_eval(compiled_source, identifier, offset)`. `compile!` is at `:418` and `compiled_source` at `:443`.
- trails today: `packages/actionview/src/template.ts:419` `compile` builds `compiledSource()` (`:385`) and `(0, eval)`s it.
- The build step already exists: `packages/trails-tsc/src/build-views.ts` writes `.trails/views/` and `watch-views.ts` rebuilds on change. It emits only type-checking stand-ins and `.d.ts` declarations, not the code that runs, and actionview never reads its output.

- The run-time compiler is hand-rolled: `compiledSource()` (`packages/actionview/src/template.ts:385-416`) nests four `with` blocks (`TopLevel`, `this`, `__yield`, locals). `with` is sloppy-mode only and cannot appear in an ES module. That code is never type-checked, and nothing strips TypeScript from it.
- `build-views` already builds a TypeScript program over typed per-template stand-ins (`virtualizeTse` and the template's scope in `packages/trails-tsc/src/plugins/tse.ts`), then calls `emitDeclarations` only (`build-views.ts:88`).

## Acceptance criteria

- Add a root CLAUDE.md section, "Templates are precompiled (`Template#compile`'s `module_eval`)". It ratifies the split: `compileJs` is the Erubi step, the typed stand-in is `compiled_source`, and `tsc` is the compiler. It states that shipped code has no eval pipeline. Code cites it.
- `build-views` emits a runtime JS module (with a source map) from each template's stand-in through the TypeScript emitter, for every `.tse` file, partials and unused templates included.
- `Template#compile` keeps its Rails name and call site. Its body loads the emitted module through an awaited `import()` (the `rbFLoad` shape) and seats the method on `mod._compiledMethods`. A missing compiled module raises.
- Delete the `with`-chain `compiledSource()` body and the `(0, eval)` in `compile`. No `eval`, `new Function` or `vm` call remains in actionview or tse-compiler shipped `src/`. A guard test fails on one.
- String-source templates (`Template::Inline`, `render inline:`, a `Template.new` from a string) raise in shipped code. Name the error class and message, and cite the section where they are raised.
- An actionview test helper (not the main export) compiles a string-source template: it builds the same stand-in, runs `ts.transpileModule` (as `packages/trailties/src/template-builder/testing.ts` does), and evaluates the result. Test setup installs it.
- Tests: a file-backed render runs the emitted module. A missing build raises. In shipped code, an inline render raises. With the helper installed, an inline render works.
