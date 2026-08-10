---
title: "api:calls:args ratchet over its own only-shrink baseline"
status: claimed
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: ["call-args-artifact-and-report"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
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

**The baseline must be its own tree**, `scripts/api-compare/call-mismatches-args-exclude/`,
keyed `package + tsFile + rubyName + call + rubyArgs`. It cannot fold into
`call-mismatches-exclude`: that key has no argument component, and RFC 0084
measures its **row count** as the debt metric — mixing a second dimension into
it corrupts that measurement.

Per the RFC §4 narrowing, **gate `shape` rows only**; `naming` rows (argument
lists differing only in a `ref:` identifier spelling — ~33% of the population,
the local/parameter-identifier dimension) stay report-only until they get their
own burndown RFC.

Seeding the baseline is a separate `main`-only PR
(`call-args-baseline-seed`), not part of this one.

## Acceptance criteria

1. `scripts/api-compare/lint-call-args.ts` gates `shape` rows against
   `call-mismatches-args-exclude/`, only-shrink, with the stale-row arm.
2. `pnpm api:calls:args` / `parity:api:calls:args` scripts exist and the gate
   runs in the `Rails API/Test Comparison` CI job.
3. The gate regenerates the artifact itself before reading it.
4. A partial-scope artifact (fewer packages than CI) is rejected, matching
   `lint-call-mismatches.ts`.
5. `naming` rows are excluded from the gate and reachable via `--report`.
6. `CONTRIBUTING.md` / `CLAUDE.md` "Before you open the PR" gains the new gate,
   with the same only-shrink / no-reseed guidance the calls baseline carries.
