---
title: "build-freshness-guard-ts7-build-api"
status: blocked
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "TS 7.1 exposes no programmatic solution builder / up-to-date API; waits on recheck-ts7-api-surface (TS 7.1 stable, 2026-11-24)"
closed-reason: null
---

## Context

No Rails counterpart; this is the api-compare stale-build guard. Split out of
`build-freshness-guard-fail-closed-oracle` (trails#8035). That PR pinned the
`tsc --build --dry` run in `scripts/api-compare/build-freshness.ts` `staleBuilds`
to `--locale en` and made it fail closed: every built project has to get one of
the three verdicts (would build / would update timestamps / is up to date), or
the guard throws.

It still spawns the CLI and reads its prose. Every stale project also collapses
to a single `OUT_OF_DATE`, where TS 5's `getUpToDateStatusOfProject` used to
report a reason (`OutOfDateWithSelf`, `OutOfDateRoots`, `UpstreamOutOfDate`, …)
that `staleBuildMessage` printed. TS 7.1 nightlies expose no programmatic
solution builder or up-to-date API (RFC 0125 § "What it does not close:
`--build`").

## Acceptance criteria

- [ ] When `recheck-ts7-api-surface` finds a TS 7 programmatic build or
      up-to-date API, move `staleBuilds` onto it in process, with no `execFile`.
- [ ] Bring back per-status reasons in `StaleBuild.status` and in
      `staleBuildMessage`.
- [ ] `scripts/api-compare/build-freshness.test.ts` still builds real projects.
      No stubbed oracle for the up-to-date cases.
