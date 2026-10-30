---
title: "A production boot reaches playwright, vite and rollup through two export sites"
status: done
updated: 2026-10-30
rfc: "0061-ci-failures"
cluster: null
packages: ["actionpack", "trailties"]
deps: []
deps-rfc: []
est-loc: 140
priority: 1
pr: trails#9495
claim: "2026-10-30T15:56:49Z"
assignee: "keep-playwright-and-vite-out-of-a-production-boot"
blocked-by: null
closed-reason: null
---

## Context

A production trails server reaches playwright, vite and rollup through two
export sites. Neither is needed to serve a request, and both are measured:

1. **`system-testing` on the `action-dispatch` barrel.**
   `packages/actionpack/src/action-dispatch/index.ts` exported `SystemTestCase`,
   `Driver` and `Server`. `system-testing/driver.ts:30` imports playwright. The
   import is _already_ lazy (`await import(PLAYWRIGHT_MODULE)`), and that does
   not help: a const specifier is an import edge, so playwright joins the graph
   of everything that can reach the barrel — which every app does, because
   `config/application.ts` imports actionpack on its first line.

2. **`trailties`' `"."` export was `./dist/cli.js`.**
   So `import { Application } from "@blazetrails/trailties"` pulled in commander,
   every command, the generators, and — via `commands/server.ts` →
   `server/dev-server.ts:2` — vite and rollup. A deployed server never
   constructs a dev server; it takes the `Handler.Node.run` branch.

Both were proven by compiling trails' own production server path to a native
binary (`examples/perry-native`, rung `08-serve`):

| measurement | before                                   | barrel cut              | both cuts           |
| ----------- | ---------------------------------------- | ----------------------- | ------------------- |
| compile     | OOM at 12 GiB, then TIMEOUT at 60 min    | 1 module failed codegen | **succeeds, 1065s** |
| modules     | 1720                                     | 1713                    | 1620                |
| playwright  | 570 warnings, 43 min stall on one bundle | 0                       | 0                   |
| vite        | present                                  | present                 | 0                   |
| peak RSS    | 20.0 GiB                                 | 10.6 GiB                | —                   |

The native compiler is what made the cost legible, but it is not the reason to
fix it: a bundler ships the same dead weight, and a browser-automation driver
has no business being reachable from a production boot.

Notably the first cut removed only 7 of 1720 modules and bought 43 minutes of
compile time, because `playwright-core/lib/coreBundle.js` is one enormous
bundled file. Module count is the wrong metric for this class of problem.

## Converged shape

The working diff exists on a prototype branch and is small — two moved export
blocks, one new entry file, one `package.json` change. It is not committable as
it stands, and this story is the work of making it green rather than
rediscovering it.

1. `packages/actionpack/src/system-testing.ts` — new entry carrying
   `SystemTestCase`, `DEFAULT_HOST`, `Driver`, `Server` and their types.
2. `action-dispatch/index.ts` — drop those three export blocks.
3. `packages/trailties/src/index.ts` — new runtime entry exporting `Trails`,
   `Application`, `Engine`, `Trailtie` (exactly what `cli.ts:19-22` re-exports).
4. `packages/trailties/package.json` — `"."` to `./dist/index.js`, CLI to a new
   `"./cli"` subpath.

**The open decision, and the reason this is not already a PR.**
`@blazetrails/actionpack` declares `main` and no `exports` map, so
`@blazetrails/actionpack/system-testing` does not resolve. Adding an `exports`
map to a package that has never had one changes deep-import behaviour for
existing consumers (`pkg/dist/...` paths stop working unless a wildcard is
chosen deliberately). Either add the map as a deliberate, documented change, or
land the file and have consumers import the built path. Pick one in the PR.

In-repo safety was checked and is reassuring: the barrel is the only importer of
`system-test-case.js`; nothing imports `SystemTestCase`, `Driver`,
`DrivenByOptions` or `ServedByOptions` anywhere; only `Trails` (15 uses) and
`Application` (5) are imported from the trailties main entry; and
`bin/trails.js` loads `../dist/bin.js` by path, so the `trails` executable is
untouched by the entry split.

## Acceptance criteria

- [ ] A production boot's module graph reaches neither playwright nor vite, and
      a test asserts it rather than a comment claiming it.
- [ ] `SystemTestCase`, `Driver` and `Server` remain importable through a
      subpath that actually resolves, and system tests still pass.
- [ ] `trails new`'s generated app boots and serves with the split entry; the
      `trails` CLI is unaffected.
- [ ] `pnpm test` and `pnpm build` green across actionpack and trailties — the
      barrel cut moves exported symbols, which is exactly what Unit Tests
      catches.
- [ ] The `exports`-map question above is decided in the PR body, not left
      implicit.
