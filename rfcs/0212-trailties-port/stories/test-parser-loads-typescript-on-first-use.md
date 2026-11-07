---
title: "TestParser loads the TypeScript compiler on first use so Runner imports it directly"
status: done
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9841
claim: "2026-11-07T17:17:13Z"
assignee: "app-generator-adds-master-key-and-credentials"
blocked-by: null
closed-reason: null
---

## Context

`Rails::TestUnit::Runner` (`vendor/rails/v8.0.2/railties/lib/rails/test_unit/runner.rb:5`) `require`s `rails/test_unit/test_parser` at the top. `Filter#definition_for` calls `TestParser.definition_for` directly. In trails (`packages/trailties/src/test-unit/runner.ts`, trails#9790), `runner.ts` loads `test-parser.ts` with an awaited `import()` in `testLocations`, into a module-level `let TestParser`. `Filter#definitionFor` then reads it as `TestParser!`. The reason: `test-parser.ts` imports `typescript` at module evaluation, and `testing.rake`'s tasks (`testing.ts`, loaded by every rake run) import `runner.ts`. A generated app has no `typescript`. So `definitionFor` depends on `testLocations` having run first.

## Acceptance criteria

- `test-parser.ts` acquires the compiler itself on first use: an awaited `TestParser` load step that `Runner.run` awaits before parsing, or an `API` constructed lazily from a dynamically-imported module seated once at boot of the test command. `runner.ts` then imports `TestParser` with a plain ES import, as `runner.rb:5` does.
- The `let TestParser` slot and its `@noRailsEquivalent PERMANENT` receipt are deleted.
- `trails db:migrate` in a generated app with no `typescript` still succeeds, as checked by `Generated App Tests`.
