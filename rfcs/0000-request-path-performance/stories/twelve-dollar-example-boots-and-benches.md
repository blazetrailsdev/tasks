---
title: "examples/twelve-dollar-server boots under trails server and runs its build.sh"
status: ready
updated: 2026-11-13
rfc: "0000-request-path-performance"
cluster: request-perf
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On main, `examples/twelve-dollar-server` does not boot:

- `bin/trails` is missing, so `trails server` prints `trails new` help.
- `autoloadLib` runs before `Application.register`, which raises `Cannot read properties of null (reading 'autoloaders')`.
- Zeitwerk expects `lib/jwt.ts` to define `Jwt`.
- Callbacks are passed as bare strings instead of `":name"`.
- `config.ts` does not export `Config`.

`build.sh` hits `ERR_PNPM_TASK_CYCLE`, and `@blazetrails/rackup` is not a
dependency.

The fixed tree passed all 42 checks of the challenge's `test/test.sh` on AWS.
The fix is in the `fix/twelve-dollar-boot` worktree, against main `094dec8aa8`.

## Acceptance criteria

- `bin/trails` is copied from the `trails new` template.
- `config/application.ts` registers in its static block and awaits
  `autoloadLib({ ignore: ["assets", "tasks", "jwt.ts"] })` at top level.
- The callbacks use the `":requireAuthentication"` spelling, and `config.ts`
  exports `Config`.
- `build.sh` builds with `pnpm exec tsc --build` over the four packages, and
  the rackup dependency is added.
- `start.sh` passes `--max-semi-space-size=64` through `NODE_OPTIONS`. Measured:
  p95 121 → 101 ms at 5,000 users.
- The challenge's `test/run.sh` passes 42/42.
