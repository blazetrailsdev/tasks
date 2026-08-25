---
title: "parity:api:calls:args ratchet over its own only-shrink baseline"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: ["call-args-artifact-and-report"]
deps-rfc: []
est-loc: 300
priority: null
pr: 6334
claim: "2026-08-10T12:55:18Z"
assignee: "call-args-naming-dimension-disposition"
blocked-by: null
closed-reason: null
---

## Context

The gating half of the RFC 0025 `## Call-argument fidelity` §4 recommendation.
Depends on `call-args-artifact-and-report`.

`lint-call-mismatches.ts` is the template: only-shrink baseline, regenerate the
artifact inside the gate (a stale artifact reports movement that never
happened), stale-row arm, partial-scope rejection, per-file sharding.

**The baseline shares the existing shards** (decision reversed 2026-08-10 —
see `call-args-rows-share-existing-shards`). Call-argument rows live in
`scripts/api-compare/call-mismatches-exclude/<package>/<path>.json` next to the
call-set rows for the same source file, keyed
`package + tsFile + rubyName + call + rubyArgs` and discriminated by
`kind: "args"`; call-set rows have `kind` absent or `"calls"`. Both new fields
are optional so every existing shard file parses unchanged and no reseed is
needed. RFC 0084's **row count** debt metric is preserved by filtering on
`kind`, not by a separate tree. Do NOT create `call-mismatches-args-exclude/`.

Per the RFC §4 narrowing, **gate `shape` rows only**; `naming` rows (argument
lists differing only in a `ref:` identifier spelling — ~33% of the population,
the local/parameter-identifier dimension) stay report-only until they get their
own burndown RFC.

Seeding the baseline is a separate `main`-only PR
(`call-args-baseline-seed`), not part of this one.

## Acceptance criteria

1. `scripts/api-compare/lint-call-args.ts` gates `shape` rows against the
   `kind: "args"` rows of `call-mismatches-exclude/`, only-shrink, with the
   stale-row arm. The call-set gate filters to `kind` absent/`"calls"` and its
   row count is unchanged — assert the exact pre-change number in a test.
2. `pnpm parity:api:calls:args` / `parity:api:calls:args` scripts exist and the gate
   runs in the `Rails API/Test Comparison` CI job.
3. The gate regenerates the artifact itself before reading it.
4. A partial-scope artifact (fewer packages than CI) is rejected, matching
   `lint-call-mismatches.ts`.
5. `naming` rows are excluded from the gate and reachable via `--report`.
6. `CONTRIBUTING.md` / `CLAUDE.md` "Before you open the PR" gains the new gate,
   with the same only-shrink / no-reseed guidance the calls baseline carries.
