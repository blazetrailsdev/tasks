---
title: "zeitwerk-kernel-require-loader-arm-calls-original-require"
status: ready
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages: []
deps:
  - zeitwerk-kernel-require-load-path-feature-arm
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

`Kernel#require`'s loader arm (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/core_ext/kernel.rb:24-31`)
calls `zeitwerk_original_require(path)` for a `.rb` path a loader manages, then
`loader.__on_file_autoloaded(path) if required`. trails#9948 seated
`zeitwerkOriginalRequire` (`packages/zeitwerk/lib/core-ext/kernel.ts`) and the
no-loader arm (`:34`) calls it, but the loader arm still goes through
zeitwerk's own module-level `require` in the same file, which runs the
`import()` itself (reload generation, `importer`, `imports` thunk) because
`onFileAutoloaded(file, exports)` (`packages/zeitwerk/lib/loader/callbacks.ts`)
needs the file's exports and `rbFRequireFile` / `rbFLoad`
(`packages/ruby-compat/lib/load.ts:111`) return only a boolean. That is the
same blocker as `zeitwerk-kernel-require-load-path-feature-arm`.

## Acceptance criteria

- The loader arm of the patched `Kernel.require` calls `zeitwerkOriginalRequire(path)`
  and then `loader.__onFileAutoloaded(path)` when it answers true, as `kernel.rb:24-31`.
- Zeitwerk's module-level `require` in `core-ext/kernel.ts` no longer performs the
  import itself; reload generations and `Loader#importer` keep working
  (`callbacks.trails.test.ts`, `reload-generation.trails.test.ts`).
