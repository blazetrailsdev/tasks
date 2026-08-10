---
title: "Shard the api-compare comparison and mismatch artifacts"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: ["shared-shard-helper"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The api-compare comparison reports under `scripts/api-compare/output/` are all
generated per (package, source file) and all read whole today:

- `api-comparison.json` plus its `-public-only`, `-privates`, and
  `-privates-only` variants
- `arity-mismatches.json` plus `-public-only`
- `options-key-mismatches.json` (`options-keys.ts`)
- `literal-mismatches.json` (`literals.ts`)
- `call-mismatches.json` — the call gate's artifact,
  `lint-call-mismatches.ts:181` `ARTIFACT_PATH`, written only under
  `compare.ts --calls` (`ci.yml:1430`) and read by both the gate
  (`ci.yml:1438`) and `build.ts:66`
- `call-arg-mismatches.json` — the new advisory artifact from RFC 0095
- `dep-lint.json` (`lint-deps.ts`, `ci.yml:1514`)

Gitignored (`.gitignore:5`), so per RFC 0097 the motive is **diffability and
single-file reads, not merge conflicts** — do not restate the conflict
rationale here.

`call-mismatches.json` is the highest-value one to shard because its committed
counterpart `call-mismatches-exclude/` is _already_ sharded on the identical
path convention (`lint-call-mismatches.ts:163,169`): once the artifact matches,
"which artifact rows correspond to this baseline shard?" becomes a path
equality instead of a scan, and the drift step's diff
(`ci.yml:1452-1469`) can be read shard-for-shard.

Every artifact carries a compared-population signal that the empty-file policy
does **not** encode (no shard means zero rows, which conflates "compared and
clean" with "not compared"). `body-pins.ts:105-111` shows the existing pattern:
scope is read from `artifact.packages`, not inferred from row presence.

## Acceptance criteria

1. Each artifact above is written as a tree
   `output/<artifact-name>/<package>/<source path → .json>` via the RFC 0097
   shared helper, and every reader loads the merged view via `loadSharded`.
2. Merged content is **equal** to today's artifact for every one of them. Prove
   it by running the pipeline before and after and diffing the merged loads and
   every gate's output; all gates report identically.
3. The compared-package scope survives sharding. It is carried explicitly (as
   `artifact.packages` is today), **not** inferred from which shards exist — a
   `--package`-scoped run must not look like a full run with everything
   converged. This is the single highest-risk regression in the story; add a
   test for it.
4. `call-mismatches` shards land on paths identical to the corresponding
   `call-mismatches-exclude/` shards for the same (package, tsFile). Add a test
   asserting `shardPath` agrees between artifact and baseline.
5. A stale shard from a previous or narrower run is removed by the writer, so no
   gate reads a ghost row.
6. `--privates` / `-public-only` variants stay separate trees, keeping the
   existing rule that privates are advisory-only.
7. No new cache layer; no per-file fingerprinting (RFC 0097 non-goal).
8. Every `OUTPUT_DIR` consumer is updated: `config.ts:7`, `drift.ts:28`,
   `orchestrate.ts:82`, `build.ts:66`, `lint-call-mismatches.ts:181`,
   `lint-deps.ts`, plus the RFC 0095 `call-arg-mismatches` reader.
9. No committed register bytes change. No baseline row added or removed.

## Coordination

Depends on the shared helper. Must not be in flight simultaneously with the
test-compare output story if the two share a reader, and must not overlap PR 6334 / RFC 0095's `call-arg-mismatches` work in `report-call-args.ts`.
