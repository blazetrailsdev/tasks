---
title: "thor-tt-templates-are-precompiled"
status: done
updated: 2026-10-26
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9351
claim: "2026-10-26T20:30:54Z"
assignee: "thor-tt-templates-are-precompiled"
blocked-by: null
closed-reason: null
---

## Context

The repo owner ruled on 2026-10-26, in review of trails#9343, that Thor `.tt` templates are precompiled the way file-backed `.tse` views are (CLAUDE.md § "Templates are precompiled"). Shipped code keeps no eval pipeline for them.

`Thor::Actions#template` (`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb:117-132`) renders `CapturableERB.new(File.binread(source), trim_mode: "-", eoutvar: "@output_buffer").result(context)`. trails#9343 ports it with `compileJs` plus `new Function("...", "with (this) { … }")` in `packages/thor/src/actions/file-manipulation.ts` (`CapturableERB#result`). That PR is the eval pipeline this story removes. It also replaced the migration generator's in-line `new Function` render (`packages/trailties/src/generators/migration-generator.ts`).

Constraints:

- A precompiled ES module is strict, so it has no `with` scope. A free constant in a template, such as `ActiveRecord` in `packages/trailties/src/generators/active-record/migration/templates/migration.ts.tt`, has to resolve another way: through the binding object, or as an import in the emitted module.
- `@output_buffer` is the binding's ivar, so the emitted code reads `this.outputBuffer` and never assigns a free name. Assigning one leaks a global, a finding from trails#9343's review.

## Acceptance criteria

- [ ] Each `.tt` under a package's generator `templates/` is compiled at build time into a module beside it, as `trails-tsc-views build --in-place` does for `.tse` files. The build is reusable by application-defined generators.
- [ ] `CapturableERB#result` loads that module with an awaited `import()` and calls it with `this` bound to the context. A source with no emitted module raises `LoadError` ("cannot load such file -- <path>"), the same as `Template#compile`.
- [ ] No `new Function` or `with` remains in `packages/thor/src`, and none in the migration generator's render.
- [ ] Thor's test fixtures (`packages/thor/src/test-helpers/fixtures/doc/*.tt` and the `.rb` templates) are compiled for the thor tests.
- [ ] The migration generator renders as Rails' `migration_template` does, with a plain `ERB.new(…, trim_mode: "-", eoutvar: "@output_buffer").result(binding)` (`vendor/rails/v8.0.2/railties/lib/rails/generators/migration.rb:65`), not `Thor::Actions::CapturableERB`, through the precompiled-module loader. trailties stops deep-importing `@blazetrails/thor/actions/file-manipulation`.
