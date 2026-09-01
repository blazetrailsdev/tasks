---
title: "rails-api / rails-tests shared-cache entries bypass the worktree-independence gate"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7156 (RFC 0126) closed the cross-worktree replay for the TS extractor by
moving the worktree-independence check into the shared-cache contract:

- `scripts/parity/shared-cache.ts` — `readSharedFor(dir, name, key, rootDir)`
  serves an entry only when it names no path outside `rootDir`;
  `publishShared(dir, name, key, body, tag)` publishes only when the payload
  names no absolute path at all (the writer's own path is not _foreign_ to the
  writer, yet is exactly as poisonous to every other worktree).
- `scripts/api-compare/extract-ts-api.ts:426` and `:484` use them.

**Three other reads/writes of the same shared cache still use the raw
`readShared` / `writeShared` and are ungated:**

- `scripts/api-compare/orchestrate.ts:133` — `rails-api` read
- `scripts/api-compare/orchestrate.ts:145` — `rails-api` write
- `scripts/test-compare/orchestrate.ts:136` / `:149` — `rails-tests` read/write

They are anchored at the same git common dir (`sharedCacheDir`), so an entry
carrying one worktree's absolute paths is reachable from every sibling worktree
exactly as the `ts-*` entries were. Nothing today is known to put a path into
`rails-api.json` — the Ruby extractor emits vendored-source-relative paths —
but that was equally true of `ts-api.json` until `extendsModuleName` regressed,
and the failure mode is silent: the run reports `OK` over another branch's
measurements with no error (measured on PR #6964: 1488 baselined vs the
branch's true 417).

Verified safe to gate: the only absolute-looking tokens in a real
`rails-api.json` are `"/"` and `"/rails/locks"` (route strings), and neither
matches `SOURCE_PATH`, so gating these call sites costs no cache hits.

Rails counterpart: none — parity tooling.

## Converged shape

Replace the four raw calls with `readSharedFor` / `publishShared`, passing each
orchestrator's own `ROOT`. Leave `readShared` / `writeShared` exported (they are
the primitives the gated pair is built on and the prune/round-trip tests use
them directly), but no production consumer should call them.

## Acceptance criteria

- [ ] `scripts/api-compare/orchestrate.ts` and `scripts/test-compare/orchestrate.ts`
      consult the shared cache through `readSharedFor` / `publishShared`.
- [ ] A test pins that a `rails-api` / `rails-tests` entry carrying worktree A's
      absolute path is not served to worktree B, mirroring the two-worktree
      harness in `scripts/parity/shared-cache.test.ts`.
- [ ] A real `rails-api.json` still hits the shared cache (no lost hits from the
      path heuristic).
- [ ] `pnpm parity:api` and `pnpm parity:test` unchanged in output.
