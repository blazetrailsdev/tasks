---
title: "Extract the per-source-file shard helper into scripts/parity"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The per-source-file sharding mechanism exists exactly once, inside the call
gate, and three of its consumers cannot reuse it:

- `scripts/api-compare/lint-call-mismatches.ts:169` — `relPathFor(k)` maps an
  entry to `<package>/<tsFile with .ts→.json>` and **throws** if `tsFile` does
  not end in `.ts`, because a shard written with any other extension would be
  written and then skipped by the `.json` reload glob (silent round-trip data
  loss).
- `:203` — `loadSplitBaseline(dir)` globs, concatenates every per-file array,
  and sorts into `compareKeys` order, after which the duplicate-key and
  partial-scope guards run across the merged set "exactly as they did against
  the monolith".
- `:216-245` — `writeSplitBaseline` repartitions, `mkdir -p`s, writes through
  `serializeBaseline`, deletes shards whose entries all converged (never
  leaving a `[]`), and prunes emptied directories.
- `:163` `BASELINE_DIR`, `:186-192` `MARK_DIR` — two sibling trees deliberately
  sharded on the same boundary.

`scripts/api-compare/body-pins.ts:168` records the blocker in prose: the call
gate's helper "cannot be reused directly: body-pins keys on `rubyFile`, not
`tsFile`/call." `arity-exclude.ts:7,25-29` and `inheritance-exclude.ts:12` key
on `rubyFile` too. So the one generalization needed is: **the source-file field
name and its extension are parameters, not constants.**

Consumers importing these by name today: `build.ts:43-45`,
`lint-call-mismatches.test.ts:364`, `baseline-json.test.ts:107`.

`scripts/parity/` is the established shared home for cross-tool parity code
(`conventions.ts`, `shared-cache.ts`, `write-json-manifest.ts`, `types.ts`) and
is already imported by the call gate as `@blazetrails/parity/conventions` and
`@blazetrails/parity/types`.

This story is **pure extraction**: the three existing trees keep their exact
on-disk bytes. It is the dependency of every other story in RFC 0097.

## Acceptance criteria

1. A new module under `scripts/parity/` exports `shardPath`, `loadSharded`, and
   `writeSharded`, generalizing `relPathFor` / `loadSplitBaseline` /
   `writeSplitBaseline`. The source-file field name (`tsFile` / `rubyFile`) and
   its expected extension (`.ts` / `.rb`) are call-site parameters.
2. A source path not ending in the caller's declared extension throws, with a
   message naming the field, the value, the package, and why (the `.json` glob
   would skip it) — i.e. the guard at `lint-call-mismatches.ts:170-177`
   preserved, not weakened.
3. The api-compare copies are **deleted**, not duplicated. `relPathFor` and
   `loadSplitBaseline` either re-export from the shared module or their three
   import sites (`build.ts:43-45`, `lint-call-mismatches.test.ts:364`,
   `baseline-json.test.ts:107`) move to it in this PR.
4. The new module is registered wherever a new `scripts/parity` subpath must be
   (vitest alias + both dx-test tsconfigs) — `pnpm typecheck` alone does not
   catch a missing registration.
5. `writeSharded` writes committed trees through `serializeBaseline`
   (`scripts/api-compare/baseline-json.ts`) only; the em-dash-escaping trap is
   preserved. It still deletes converged shards rather than writing `[]`, and
   still prunes emptied directories.
6. Byte-identical output: after this PR, `pnpm exec tsx
scripts/api-compare/lint-call-mismatches.ts --write` leaves
   `call-mismatches-exclude/`, `call-mismatches-wide-exclude/`, and
   `call-mismatches-unreviewed/` with a clean `git diff` (the CI drift step at
   `.github/workflows/ci.yml:1452-1469` is the oracle).
7. Unit tests for the shared module: the extension throw, a merged load across
   two shards sorting identically to one monolithic array, and a write that
   deletes a shard emptied by convergence.
8. No behaviour change to any gate. No register row added, removed, or reworded.

## Coordination

Touches `lint-call-mismatches.ts` and `build.ts`. Must **not** be in flight at
the same time as PR #6334 (call-argument ratchet), which is editing the same
trees. Land after it merges, or coordinate.
