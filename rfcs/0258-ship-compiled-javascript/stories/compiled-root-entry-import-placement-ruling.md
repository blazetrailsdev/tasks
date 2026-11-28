---
title: "compiled-root-entry-import-placement-ruling"
status: ready
updated: 2026-11-28
rfc: "0258-ship-compiled-javascript"
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

trails#10780 makes `Application#initializeBang` (`packages/trailties/lib/application.ts`) import `<root>/.trails/entry.generated.js` before `runInitializers`, when the root is compiled (`config.js`, no `config.ts`) and the entry is no older than `config.js`. Rails' `initialize!` (`vendor/rails/v8.0.5.2/railties/lib/rails/application.rb:442-447`) is only the raise guard, `run_initializers(group, self)` and `@initialized = true`, so the import is an invented arm, receipted `@inventedArm if — CONVERGEABLE` against this story.

Why it sits there: the entry's `install.generated.js` sets `loader.imports` / `loader.manifest` on `Trails.autoloaders` and its `boot.generated.js` calls `registerCompiledFiles`. Both must run after `config/application` has evaluated (they read `Trails.application`'s loaders) and before `setup_main_autoloader` / `load_config_initializers` run. `initialize!` is the one trails method every boot (`config.ts` → `config/environment`, `bin/jobs`, rake `environment`) passes through between those two points. A generated app's compiled `config/environment.js` cannot do it, because tsc emits a static `import "./application.js"` and the entry choice depends on the run-time root.

## Acceptance criteria

- The operator rules on one of these:
  - keep the arm in `initializeBang` and mark the receipt `PERMANENT`, citing a CLAUDE.md section;
  - move it into the generated `config/environment` template;
  - move it elsewhere.
- The receipt and code match that ruling.

## Ruling (operator, 2026-11-27)

Move it elsewhere: a Bootstrap initializer. Remove the entry import from `Application#initializeBang`, so `initialize!` matches Rails again (raise guard, `run_initializers`, `@initialized = true`). Add a trails Bootstrap initializer (e.g. `load_compiled_entry`) that does the same import under the same conditions (compiled root, entry no older than `config.js`), ordered before `setup_main_autoloader`.

- Confirm `runInitializers` awaits an async initializer body; if it does not, make it await, since the import is async.
- Replace the `@inventedArm if — CONVERGEABLE` receipt on `initializeBang` with a receipt on the new initializer that names it as a trails-only Bootstrap initializer with no Rails counterpart.
- Every boot path (`config/environment`, `bin/jobs`, rake `environment`) still loads the entry before `setup_main_autoloader`; cover this with a test.
