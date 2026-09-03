---
title: "fs-adapter moves into ruby-compat, bootstrap included, and is demoted from public API to the backend contract"
status: in-progress
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: ["narrow-ruby-compat-leaf-guard-to-static-imports"]
deps-rfc: []
est-loc: 350
priority: 2
pr: 7422
claim: "2026-09-03T00:00:24Z"
assignee: "move-fs-adapter-into-ruby-compat-as-a-backend-contract"
blocked-by: null
closed-reason: null
---

## Context

Moves `packages/activesupport/src/fs-adapter.ts` (483 LOC) into `ruby-compat`,
unchanged in behaviour, and demotes it from public API to the **backend
contract** the Ruby classes register against. No call site changes shape here —
this story is the relocation, `port-file-and-dir-classes-onto-the-fs-backend`
is the surface.

The registration seam already exists and needs no invention:
`fs-adapter.ts:161` `registerFsAdapter(name, fs, path)`. RFC 0129's
`move-monitor-mixin-to-ruby-compat` blocker note claims "no
`registerFsBackend()`-shaped precedent exists to copy" — that is wrong on the
facts, and all seven adapters export one (`crypto-adapter.ts:282`,
`process-adapter.ts:170`, `child-process-adapter.ts:54`, `os-adapter.ts:31`,
`async-context-adapter.ts:71`, `http-adapter.ts:44`).

The Node bootstrap (`tryAutoRegisterNode`, `fs-adapter.ts:265-276`, and
`syncBuiltinLoader`, `:250-263`) moves **with** it: RFC 0135's decision is that
all registration lives in the leaf and no package re-registers on another's
behalf. That is only legal once
`narrow-ruby-compat-leaf-guard-to-static-imports` has landed — it is this
story's dep for that reason, not for tidiness.

`FsAdapter`, `PathAdapter`, `FsStatResult` and `FsDirent` (`fs-adapter.ts:5-157`)
stay exported, because a consumer registering a non-Node backend needs to name
them; `getFs()` / `getPath()` (`:459-465`) stay exported **only** for the
duration of the flip chain and are deleted by
`unexempt-file-and-dir-from-core-class-receivers`.

## Acceptance criteria

- `packages/ruby-compat/src/fs-adapter.ts` holds the file, bootstrap included;
  nothing remains at the activesupport path and no re-export shim is left there
  (RFC 0135's standing rule) — importers are repointed in this PR.
- `scripts/ruby-compat-leaf.test.ts` passes with the adapter in the package,
  over the narrowed rule.
- `packages/ruby-compat/package.json` still declares no `dependencies`.
- `pnpm parity:api:extra:gate` green; the `ruby-compat` `total` bump in
  `extra-surface-mark.json` is the only mark change and activesupport's falls
  by the same names.
- `pnpm build`, `pnpm typecheck`, `pnpm lint` green.
