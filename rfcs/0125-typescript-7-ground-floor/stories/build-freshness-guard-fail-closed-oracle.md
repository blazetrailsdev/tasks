---
title: "Make the build-freshness guard's tsc --dry oracle fail closed, then move it to a TS 7 build API"
status: done
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8035
claim: "2026-09-24T15:32:22Z"
assignee: "build-freshness-guard-fail-closed-oracle"
blocked-by: null
closed-reason: null
---

## Context

No Rails counterpart; this is the api-compare stale-build guard. Since trails#8032,
`scripts/api-compare/build-freshness.ts` `staleBuilds` spawns TS 7's own `tsc --build --dry` (resolved
through `createRequire(import.meta.url).resolve("typescript/package.json")`). It treats every stdout
match of `/A non-dry build would build project '(.+)'/g` as `OUT_OF_DATE`. Before, it asked TS 5's
`ts.createSolutionBuilder(...).getUpToDateStatusOfProject`. TS 5 reads TS 7's `.tsbuildinfo` (a
different format: `packageJsons`, range-encoded `root`) as `TsVersionOutputOfDate` for every project,
and TS 7.1 exposes no programmatic up-to-date API (RFC 0125 § "What it does not close: `--build`").

The replacement has three weaknesses:

- It depends on the English CLI message text. A reworded message or a non-`en` locale matches nothing, and the guard then reports every package as fresh. That fails open.
- It collapses TS 5's status enum (`OutOfDateWithSelf`, `OutOfDateRoots`, `UpstreamOutOfDate`, …) into one `OutOfDate`, which loses the reason `staleBuildMessage` used to print.
- It spawns a subprocess where the guard used to call in process.

## Acceptance criteria

- [ ] Right now: pass `--locale en` to the dry run, and fail closed. If the dry run names no project and prints no "is up to date" line for any project, throw instead of reporting fresh. Add a test that a stubbed empty stdout throws.
- [ ] When TS 7 ships a programmatic build or up-to-date API (checked under `recheck-ts7-api-surface`), move `staleBuilds` onto it and bring back per-status reasons in `staleBuildMessage`.
- [ ] `scripts/api-compare/build-freshness.test.ts` keeps building real projects. No stubbed oracle for the up-to-date cases.
