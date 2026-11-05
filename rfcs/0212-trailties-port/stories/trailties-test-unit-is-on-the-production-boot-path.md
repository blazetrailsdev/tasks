---
title: "A production build reaches the CLI, and the TypeScript compiler through it: split a production entry from the dev CLI"
status: in-progress
updated: 2026-11-05
rfc: "0212-trailties-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: trails#9742
claim: "2026-11-05T15:36:26Z"
assignee: "trailties-test-unit-is-on-the-production-boot-path"
blocked-by: null
closed-reason: null
---

## Context

A Perry AOT build of a trails app's server contains **the TypeScript
compiler**, and with it every CLI command, generator and the test runner.
Perry compiles every statically-resolvable `import()` into the binary, so a
lazy `() => import("../commands/x.js")` table is a hard edge for it even though
Node only loads the arm that runs.

### The edge (re-traced 2026-11-05)

The earlier draft of this story blamed `all.ts:16`'s
`"trails/test_unit/railtie"` entry. That is wrong: `test-unit/trailtie.ts`
imports only `../trailtie.js`, as Rails' `test_unit/railtie.rb` requires only
`rails/test_unit/line_filtering`. Walking the relative import graph of
`packages/trailties/src`, `typescript/unstable/*` and `commands/test.ts` are
**unreachable** from `index.ts`, `all.ts` and `server/index.ts`. The only path is
the CLI:

```text
bin.ts
 -> command.ts
 -> command/behavior.ts        (LOAD_PATH: one import() per command, :9-31)
 -> commands/test.ts           (static: ../test-unit/runner.js, :6)
 -> test-unit/runner.ts        (static: ./test-parser.js, :19)
 -> test-unit/test-parser.ts   (static: typescript/unstable/sync, typescript/unstable/ast, :2-3)
```

The same `LOAD_PATH` pulls in `commands/new.js`, `generate.js`, `destroy.js`
(the generator tree and Thor), `dev.js` (vite), `console.js`, and the rest. So
an app whose production process starts as `trails server` puts the whole
development toolchain in the binary. Rails has the same shape: in production
`bin/rails server` also goes through `Rails::Command.invoke`, and Ruby pays
nothing for it because `require` is lazy. An AOT compiler cannot be lazy, so
trails needs what Rails gets from `config.ru` and Bundler groups: a production
entry that never goes through the command dispatcher.

That entry exists in Rails already. Puma and `rackup` boot `config.ru`, which
requires `config/environment` and runs `Rails.application`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config.ru.tt`,
`config/environment.rb.tt`). No command class is loaded. `trails server` in
development keeps its Rails path through `Rails::Command::ServerCommand`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb`).

### Two builds

- **Development build.** Entry `bin/trails` (trailties `./commands` export,
  `bin.ts`). Contains the command dispatcher, generators, the test runner, the
  TypeScript compiler, vite and playwright. Used for `trails new/generate/test/dev/console`.
  Not AOT-compiled.
- **Production build.** Entry the app's `config.ru` (rackup through trailties'
  `./server` export) to `config/environment` to `trails/all`. It must not reach
  `command/`, `commands/`, `generators/`, `test-unit/runner.ts`,
  `test-unit/test-parser.ts`, `typescript`, `typescript-5`, `vite`, `rollup` or
  `playwright` by any static or statically-resolvable edge. This is the graph
  Perry compiles.

A production deploy that today runs `trails server` runs the production entry
instead. The generated app's production start command (Procfile / Dockerfile
template) is the place that changes.

### Related

- `keep-playwright-and-vite-out-of-a-production-boot` (0061, done, trails#9495)
  and `trailties-main-entry-point-is-the-cli` (0192, done, trails#9015) fixed
  two export sites but asserted no graph property, so this regressed through
  the command table.
- `trailties-dot-entry-is-rails-not-cli` (0192, draft) is about the `.` export
  mirroring `rails.rb`. It does not cover the server entry.
- `source-annotation-extractor.ts` reaches the compiler through a dynamic
  `import()` in a `try/catch` and is reached only from `commands/notes.js`, so
  it is on the dev side of the split already.
- trails-tsc's `typescript-5` default imports are a second copy of the compiler.
  They are covered by the same forbidden set.

### Measured cost (from the earlier draft)

Compiling `examples/perry-native`'s server graph: 2300 modules, 2229 with
`typescript/unstable/*` stubbed (-71), OOM-killed in Perry's `stage=lower` at
a 44 GiB cap. Perry's own calibration (`perry-codegen/src/workers.rs`) puts a
9 MB `typescript.js` at a 3.4 GiB peak in lowering. Re-measure without the
stub once the split lands. The 2300 figure includes the command table, so the
drop should be much larger than 71.

## Acceptance criteria

1. A test walks the import graph (static imports and string-literal
   `import()`, following package specifiers through `exports`) from the
   production entry (`./server` plus `./all`) and asserts no path reaches the
   forbidden set above. It prints the offending chain on failure. It is not a
   check by inspection, and it does not rely on the `*.test.*` convention.
2. The production server boots with no command class loaded: the
   `config.ru` path to `config/environment` to `Trails.application` serves a
   request, and `command/behavior.ts`'s `LOAD_PATH` is not evaluated.
3. The development build is unchanged: `trails server`, `trails test`,
   `trails generate` and `trails dev` behave as they do today, and
   `Rails::Command::ServerCommand`'s path stays the Rails one.
4. The generated app's production start command uses the production entry,
   following Rails' `config.ru`. No trails-only boot entry is invented where
   `config.ru` / `config/environment` cover it. Any new export carries
   `@noRailsEquivalent` with a receipt.
5. `examples/perry-native` compiles its server graph with no `--module-alias`
   stub for `typescript/unstable/*`, and the PR body reports the before/after
   module count.
