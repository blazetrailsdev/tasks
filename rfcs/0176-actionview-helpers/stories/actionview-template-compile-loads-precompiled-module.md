---
title: "Template#compile loads the precompiled .tse module; no eval outside test code"
status: ready
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
closed-reason: null
---

## Context

Repo-owner ruling (2026-10-19): file-backed `.tse` templates are precompiled, in every environment. Follow-up ruling (2026-10-20): no eval pipeline anywhere in shipped code. Run-time compilation exists only in test code.

- Rails: `Template#compile` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:500-502`) is `mod.module_eval(compiled_source, identifier, offset)`. `compile!` is at `:418` and `compiled_source` at `:443`.
- trails today: `packages/actionview/src/template.ts:419` `compile` builds `compiledSource()` (`:385`) and `(0, eval)`s it.
- The build step already exists: `packages/trails-tsc/src/build-views.ts` writes `.trails/views/` and `watch-views.ts` rebuilds on change. It emits only type-checking stand-ins and `.d.ts` declarations, not the code that runs, and actionview never reads its output.

## Acceptance criteria

- Add a root CLAUDE.md section, "Templates are precompiled (`Template#compile`'s `module_eval`)", ratifying the deviation. It also states that shipped code has no eval pipeline. Code cites it.
- `build-views` emits one runtime JS module per `.tse` file, partials and unused templates included. Each module's function matches what `compiledSource()` produces today, including strict locals, `parameters`, and the source map. `build-views` and actionview share one code generator.
- `Template#compile` keeps its Rails name and call site. Its body loads the template's emitted module through an awaited `import()` (the `rbFLoad` shape) and seats the method on `mod._compiledMethods`. A missing compiled module raises.
- No `eval`, `new Function`, or `vm` call remains under any package's shipped `src/` (non-test files). Add a lint or guard test that fails on one.
- String-source templates (`Template::Inline`, `render inline:`, a `Template.new` from a string) have no compiled module. In shipped code they raise when compiled. Name the error class and message, and cite the CLAUDE.md section where they are raised.
- The eval-based compile moves to actionview test helpers (`src/test-helpers/` or the `testing` entry, never the main export). Test setup installs it so tests that build templates from strings keep working. It reuses the shared code generator.
- Tests: a file-backed render uses the precompiled module. A file-backed template with no build output raises. In shipped code, an inline render raises. With the test helper installed, an inline render works.
