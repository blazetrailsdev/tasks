---
title: "An optional peer dependency is not reachable by literal dynamic import"
status: draft
updated: 2026-11-04
rfc: "0221-ahead-of-time-compile-compatibility"
cluster: optional-deps
packages:
  [
    "activerecord",
    "trailties",
    "actionpack",
    "actioncable",
    "activestorage",
    "activesupport",
    "image-processing",
  ]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`await import("some-package")` with a **literal** specifier is a static edge to
a whole-program compiler, which must emit everything reachable. Laziness keeps a
module out of Node's boot; it does not keep it out of a binary. So an optional
peer dependency the application never asked for is compiled anyway — and if it
cannot be parsed, the build fails outright.

The `expo-sqlite` adapter was the first instance and is **already fixed**
(trails#9724). The chain was
`activerecord/src/connection-adapters/expo-sqlite-adapter.ts` →
`sqlite/expo-sqlite.ts` → `expo-modules-core` → `react-native/index.js`, whose
Flow syntax perry's parser rejects:

    Error: Failed to parse .../react-native/index.js
    Parse error: Expected("from", "typeOf")

trails was already written correctly there — `import type` plus a dynamic
`import()` — which is the point: review cannot catch this, because the code
looks right and is right on Node. The two live edges were the `namespaces.ts`
autoload map and `trailties/src/database.ts`, both naming the module with a
literal specifier. Removing them took `react-native` out of the graph entirely
and grew the boot graph 1874 → 1934 modules.

There are **20 optional peer dependencies across 9 packages**: `actioncable`
(pg, websocket-driver), `actionpack` (playwright, vite, vitest), `activerecord`
(activejob, msgpack, better-sqlite3, expo-sqlite, libsql, mysql2, pg),
`activestorage` (image-processing), `activesupport` (msgpack, nokogiri),
`image-processing` (wasm-vips), `trailties` (activestorage, typescript).

A sweep for literal-specifier sites found only two left, both latent:

- `actionpack/src/action-dispatch/system-test-case.ts:80` — `import("vitest")`
- `actionpack/src/action-dispatch/system-testing/server.ts:40` — `import("vite")`

Neither is reachable from the `08-serve.ts` boot entry today (0 modules
collected), so **nothing is broken right now**. They matter because a test
runner and a bundler would be compiled into any binary built from an entry point
that does reach system testing. The database drivers (`better-sqlite3`, `pg`,
`mysql2`, `libsql`) already avoid the pattern — they go through `createRequire`
or a driver indirection — and need no change.

The rule worth adopting from this: an optional peer dependency may be reached
through a computed specifier, a registry the app populates by importing, or
`createRequire`, but not through a literal `import()` in code the framework
itself reaches.

## Acceptance criteria

- [ ] The two remaining literal-specifier sites (`vitest`, `vite`) no longer
      name their package literally in framework-reachable code, or carry a note
      saying why they must
- [ ] Each of the 20 optional peer dependencies is recorded as either
      unreachable by literal specifier, or deliberately exempt with a reason
- [ ] A lint rule flags a literal `import("<optional-peer>")` under
      `packages/*/src`, generated from each package's
      `peerDependenciesMeta.optional`
- [ ] Opting in keeps an actionable error: a misconfigured app is told which
      import it is missing, not "nonexistent adapter" (as `expo-sqlite` now
      does via `register(…)` plus `ConnectionAdapters.resolve`)

## Definition of done

Not closed by the `expo-sqlite` fix alone, which is already merged separately.
Not closed by deleting an optional integration — the feature keeps working for
an app that opts in. A site that must keep its literal specifier is closed by
the written reason.
