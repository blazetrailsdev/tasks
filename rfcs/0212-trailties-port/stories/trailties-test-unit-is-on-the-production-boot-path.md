---
title: "trailties' test-unit code is on the production boot path, dragging in the TypeScript compiler"
status: draft
updated: 2026-11-05
rfc: "0212-trailties-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 100
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A production AOT build of a trails app contains **the TypeScript compiler**,
because `@blazetrails/trailties` puts its own test-unit code on the runtime
boot path.

Two edges do it, and neither is guarded:

1. `packages/trailties/src/all.ts:16` registers the test-unit trailtie in the
   eager trailtie map:

   ```ts
   "trails/test_unit/railtie": () => import("./test-unit/trailtie.js"),
   ```

2. `packages/trailties/src/commands/test.ts:6` statically imports
   `Runner` from `../test-unit/runner.js`, and `commands/` is itself reachable
   (`command/behavior.ts:20` resolves `../commands/runner.js`).

From there: `test-unit/runner.ts:19` imports `./test-parser.js`, and
`test-unit/test-parser.ts:2-3` statically imports the compiler —

```ts
import { API } from "typescript/unstable/sync";
import * as ts from "typescript/unstable/ast";
```

A bundler can drop an unreferenced module; an AOT compiler that resolves these
specifiers cannot. Perry compiles a statically-resolvable `import()` into the
binary, so the eager trailtie map is a hard edge, not a lazy one.

### Why the existing exclusion story does not cover this

`exclude-compiled-tests-from-published-dist` excludes `*.test.*`. **None of
these files match that glob**: the directory is `test-unit/` and the files are
`runner.ts`, `test-parser.ts`, `trailtie.ts`. They are test _infrastructure_
shipped as ordinary source, reachable from `index.ts`, and a `*.test.*`
exclusion leaves every one of them in place. That story is also scoped to
`activerecord` and argues from published bytes; this one is about runtime
reachability from the package entry point.

### Measured cost

Compiling `examples/perry-native`'s server graph with Perry:

|                                        |                                             |
| -------------------------------------- | ------------------------------------------- |
| modules in the graph                   | 2300                                        |
| after stubbing `typescript/unstable/*` | 2229 (−71)                                  |
| compile outcome                        | OOM-killed in `stage=lower` at a 44 GiB cap |

Perry's own calibration (`perry-codegen/src/workers.rs`) records a 9 MB
`typescript.js` bundle peaking at **3.4 GiB** in lowering, which is what makes
this fatal rather than merely wasteful. The build cannot be completed at all
without aliasing the compiler out.

There is a second copy in the graph — `typescript@5.9.3` via
`@blazetrails/trails-tsc`'s eight `import ts from "typescript-5"` default
imports — tracked separately; this story is the trailties edge.

Note `source-annotation-extractor.ts` reaches the same compiler but is written
correctly: type-only static imports plus a dynamic `import()` inside a
`try/catch` that returns `null`. That is the shape the test-unit edge should
have, and it is the proof the degraded path is already supported.

## Acceptance criteria

1. `@blazetrails/trailties`'s published entry point no longer reaches
   `typescript` by any static or statically-resolvable edge. Demonstrated by a
   test that walks the import graph from `src/index.ts` and asserts no path to
   `typescript`/`typescript-5`/`typescript/unstable/*` — not by inspection.
2. `trails test` still works: the test-unit runner and parser load on demand
   and the command's behaviour is unchanged.
3. The test-unit trailtie is still registered when the test environment wants
   it; booting a production app does not load it.
4. The `*.test.*` convention is not relied on to achieve any of the above,
   since none of the offending files match it.
5. An AOT build of `examples/perry-native`'s server graph compiles with no
   `--module-alias` stub for `typescript/unstable/*`, and the module count
   drop is reported in the PR body.
