---
title: "trails-tsc type-checked nothing: its entry guard never fires through its own bin"
status: in-progress
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: null
priority: 23
pr: 7331
claim: "2026-09-01T12:30:26Z"
assignee: "trails-tsc-bin-is-a-no-op"
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc` type-checked nothing. Invoked through its own bin it exited 0
with no output on a file containing `const bad: number = "not a number"`.

`packages/activerecord-cli/bin/trails-tsc.js` was:

```js
#!/usr/bin/env node
import "../dist/tsc-wrapper/cli.js";
```

and `packages/activerecord-cli/src/tsc-wrapper/cli.ts` guards its entry point
on `realpath(import.meta.url) === realpath(process.argv[1])`. Through the bin
wrapper `argv[1]` is `bin/trails-tsc.js`, never `dist/tsc-wrapper/cli.js`, so
the comparison always failed and `main()` never ran. The guard's own comment
anticipated the failure — "Without realpath, a shim invocation would leave
`main()` unrun and the CLI becomes a no-op" — but realpath does not help when
the two files are genuinely different.

Every consumer went through that wrapper, so every `pnpm typecheck` that
calls `trails-tsc` was vacuous, including
`examples/twitter-clone/package.json`'s.

Fixed in the twitter-app PR by exporting `main` and calling it from the bin.
With the fix, `examples/twitter-app` reported 23 real diagnostics on first
run (association types, a missing `@blazetrails/date` dependency, and three
genuine type errors), all since fixed.

## Acceptance criteria

- A regression test asserts `trails-tsc` exits non-zero on a project with a
  type error, invoked **through the bin** (not by importing `main`).
- `examples/twitter-clone`'s `pnpm typecheck` passes, or its real diagnostics
  are fixed — it has never actually been checked.
- Audit the other bins in the repo for the same guard shape:
  `packages/trails-tsc/bin/trails-tsc-views.js` and
  `packages/trailties/bin/trails.js`.
