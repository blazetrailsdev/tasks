---
title: "compare.ts writes the advisory call-argument mismatch artifact"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: ["call-args-normalize-and-compare"]
deps-rfc: []
est-loc: 150
priority: null
pr: 6318
claim: "2026-08-10T02:31:49Z"
assignee: "call-args-artifact-and-report"
blocked-by: null
closed-reason: null
---

## Context

Wire the `call-args.ts` comparator (see `call-args-normalize-and-compare`) into
`scripts/api-compare/compare.ts` as an advisory sub-report, per the RFC 0025
`## Call-argument fidelity` §4 rollout — advisory first, gate later, matching
this RFC's own rule that no tool breaks CI on day one.

The pattern to clone is the existing calls artifact: `checkCalls` runs per
name-matched pair inside the per-file loop, and the artifact is written under
`--calls` only (`compare.ts`, the `callsGate` block that writes
`output/call-mismatches.json` and `output/call-skeletons.json`). The new report
follows the same gating so a plain run cannot overwrite it with an empty
result, and carries the same `packages: [...]` field the ratchet reads to
reject a partial-scope artifact.

The spike paired Ruby and TS methods through `output/call-skeletons.json`;
in-tree this should reuse the same name-matched pair the `checkCalls` /
`checkLiterals` / `checkOptionKeys` callbacks already receive, so no new
matching logic is introduced.

## Acceptance criteria

1. `output/call-arg-mismatches.json` is written under `--calls`, flat across
   packages, with `generatedAt`, `note`, `packages`, `compared`, `mismatched`,
   `mismatches` — the shape of `call-mismatches.json`.
2. Each row carries `package`, `rubyFile`, `tsFile`, `rubyName`, `tsName`,
   `call`, `class` (`shape` | `naming`), `rubyArgs`, `tsArgs`.
3. The `run.sh` summary gains one advisory line, mirroring the existing
   `Calls (advisory): …` line.
4. Parity % is unchanged and no existing artifact moves.
5. A `--report` mode groups rows by package / file / class, mirroring
   `lint-call-mismatches.ts --report`.
