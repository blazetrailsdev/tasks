---
title: "actionpack's system-testing reaches vite and vitest from published non-test source"
status: ready
updated: 2026-11-05
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`@blazetrails/actionpack` ships system-testing code that reaches `vite` and
`vitest` — test and dev dependencies — from non-test source, through
statically-resolvable dynamic `import()`:

- `src/action-dispatch/system-testing/server.ts:41`
  — `const { createServer } = await import("vite");`
- `src/action-dispatch/system-test-case.ts:80`
  — `const { afterAll, expect, inject } = await import("vitest");`

Both are in `src/`, not in a `*.test.ts`, so both are compiled and published:
`dist/action-dispatch/system-testing/server.js` carries the `vite` reference.

A bundler can leave an unreferenced dynamic import alone. An **AOT compiler
cannot**: Perry compiles a dynamic `import()` whose specifier is statically
resolvable into the binary, together with its whole dependency closure. For
`vite` that closure is `rollup`, `postcss`, `lightningcss` and `jiti` (a Babel
bundle); for `vitest` it is the test runner.

`server.ts:1` is `import type { InlineConfig, ViteDevServer } from "vite"`,
which is correct and erases — the type-only import is not the problem, and
should not be "fixed" along with the two above.

### Scope note on evidence

What is verified here is the **source shape**: two non-test modules in a
published package reach test/dev-only packages by an edge an AOT compiler
follows. That is the deviation being filed.

What is **not** verified is that these two modules are in the
`examples/perry-native` server graph specifically. The perry compile log names
modules only in progress heartbeats and warnings, so it cannot be used to
prove membership either way, and an earlier attempt to read absence from it
was unsound. The separately confirmed route by which `vite` reaches that graph
runs through trailties
(`commands/server.ts:63` registers
`Handler.loadPath["rackup/handler/vite"] = () => import("../server/dev-server.js")`,
and `server/dev-server.ts:3` statically imports `vite`), which is tracked
against trailties, not here.

So this story stands on the published-package shape, not on a measured module
count. Establishing whether actionpack's edges are also live in an AOT graph
is part of the work.

### Why this matters beyond size

`vite`'s own chunk `dist/node/chunks/config.js` was one of only two modules
slow enough to emit repeated lowering heartbeats in the post-stub ladder run,
whose codegen base measured 19801 MiB resident. Compiling a dev server and a
test runner into a production binary is not a size nuisance; at this scale it
is the difference between a build that completes and one the kernel kills.

This is the same defect class as the trailties story
`trailties-test-unit-is-on-the-production-boot-path` — test infrastructure
reachable from a production entry point — in a second package. Neither is
caught by a `*.test.*` exclusion, because none of the offending files match
that glob.

## Acceptance criteria

1. `@blazetrails/actionpack`'s published entry points reach neither `vite` nor
   `vitest` by any static or statically-resolvable edge. Proven by a test that
   walks the import graph from the package's entry points and asserts no path
   to either — not by inspection.
2. System testing still works: `ActionDispatch::SystemTestCase` drives a real
   browser against a vite dev server, and the vite/vitest objects are obtained
   on demand.
3. The type-only `import type ... from "vite"` in `system-testing/server.ts`
   is left in place, or replaced with a local type, but is not the mechanism
   relied on for criterion 1.
4. It is determined and recorded whether these edges were live in an AOT
   server graph, so the trailties route and this one are not confused in
   future measurements.
5. `vite` and `vitest` are declared `devDependencies` (or peer/optional) of
   actionpack, consistent with criterion 1.
