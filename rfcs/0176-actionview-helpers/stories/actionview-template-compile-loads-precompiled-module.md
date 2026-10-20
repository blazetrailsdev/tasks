---
title: "Template#compile loads the precompiled .tse module; eval only for inline templates"
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

Repo-owner ruling (2026-10-19): file-backed `.tse` templates are precompiled, in every environment. Nothing compiles a file-backed template in the request path.

- Rails: `Template#compile` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:500-502`) is `mod.module_eval(compiled_source, identifier, offset)`. `compile!` is at `:418` and `compiled_source` at `:443`.
- trails today: `packages/actionview/src/template.ts:419` `compile` builds `compiledSource()` (`:385`) and `(0, eval)`s it.
- The build step already exists: `packages/trails-tsc/src/build-views.ts` writes `.trails/views/` and `watch-views.ts` rebuilds on change. actionview never reads that output.

## Acceptance criteria

- Add a root CLAUDE.md section, "Templates are precompiled (`Template#compile`'s `module_eval`)", ratifying the deviation. Code cites it.
- `Template#compile` keeps its Rails name and call site. For a file-backed template, its body loads the module `trails-tsc build` emitted, through an awaited `import()` (the `rbFLoad` shape), and seats the method on `mod._compiledMethods`. A missing compiled module raises; it never falls back to `eval`.
- `eval` stays only on the `Template::Inline` / string-source path (`template/inline.rb`), which Rails also compiles at run time. A file-backed template can't reach it.
- The emitted module's function matches what `compiledSource()` produces today, including strict locals, `parameters`, and `sourceURL`/source map. `build-views` and actionview share one code generator.
- Tests: a file-backed render uses the precompiled module. A file-backed template with no build output raises. An inline render still works.
