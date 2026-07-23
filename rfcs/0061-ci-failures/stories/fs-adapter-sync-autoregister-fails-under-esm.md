---
title: "getFs() sync node auto-register fails under pure ESM (no require)"
status: ready
updated: 2026-07-23
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`getFs()` / `getPath()` in `packages/activesupport/src/fs-adapter.ts` fall back to
`tryAutoRegisterNode()` when no adapter is explicitly registered. That function
obtains `node:fs` through `require("node:module").createRequire(...)`, guarded by
`typeof require !== "undefined"` (fs-adapter.ts:143). Under **pure ESM there is no
`require`**, so the guard fails, `tryAutoRegisterNode()` returns `false`, and
`resolve()` throws `No filesystem adapter configured.` for every Node ESM consumer
of the library.

This is invisible in the test suite because vitest's module runner provides a
`require` shim, so the sync path succeeds there. It surfaced for real in the
Schema Parity (trails side) CI job, where `scripts/parity/schema/node/dump.ts`
runs under tsx (pure ESM) and blew up during schema introspection.

PR #4991 unblocked that job by awaiting the async twin `getFsAsync()` at script
startup, which registers the `node` adapter before any sync `getFs()` call. That
is a call-site workaround, not a fix — every other ESM consumer that reaches a
sync `getFs()` without a prior async registration still throws.

`tryAutoRegisterNodeAsync()` (fs-adapter.ts:214) is unaffected; it uses dynamic
`import()`.

## Acceptance criteria

- `getFs()` / `getPath()` resolve the node adapter under pure ESM with no prior
  `getFsAsync()` call and no explicit `registerFsAdapter`.
- A regression test that fails on `main`: it must exercise the sync path in an
  environment without `require` (e.g. delete/shadow the vitest `require` shim, or
  run the assertion in a spawned pure-ESM child process) — a plain vitest test
  will pass on `main` and prove nothing.
- No `node:*` static imports and no `process.*` references added to
  `activesupport` source; the existing adapter-indirection pattern is preserved,
  and browser/non-node hosts still get the "not configured" error rather than a
  crash.
- Once landed, drop the `await getFsAsync()` workaround from
  `scripts/parity/schema/node/dump.ts` and confirm
  `pnpm tsx scripts/parity/run.ts --side=trails` still passes.

## Definition of done

Sync `getFs()` works in pure-ESM Node, covered by a test that is red on `main`,
and the parity-script workaround is removed.

## Verification

- New regression test red on `main`, green on the branch.
- `pnpm tsx scripts/parity/run.ts --side=trails` passes with the workaround
  removed.
