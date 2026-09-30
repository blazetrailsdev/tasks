---
title: "activerecord: restore the 12 dropped Rails branches in associations (report-arms missing rows)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 360
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=missing` (RFC 0113; `if`/`loop`/`try`/
`rescue` are report-only, only `throw` is gated). A missing arm is a Rails branch the port does not take —
9 in 10 are real (RFC 0113's stratified read). The associations pairs:

- `associations/association.ts#loadTarget` — `-try -rescue +if`
- `associations/association.ts#asyncLoadTarget` — `-if -if`
- `associations/association.ts#marshalLoad` — `-loop +if`
- `associations/association.ts#initializeAttributes` — `-if`
- `associations/collection-association.ts#findByScan` — `-if -if`
- `associations/join-dependency.ts#instantiate` — `-loop +if`
- `associations/join-dependency.ts#each` — `-loop`
- `associations/join-dependency.ts#aliases` — `-loop -loop +if`
- `associations/join-dependency/join-part.ts#each` — `-loop`
- `associations/preloader/branch.ts#constructor` — `-try -rescue +if +if`
- `associations/preloader/branch.ts#immediateFutureClasses` — `-loop +if`
- `associations/preloader/through-association.ts#recordsByOwner` — `-loop +if`

## Acceptance criteria

- [ ] Each pair's branches match its Rails body (CLAUDE.md § "Control flow"): same guards, order, early returns.
- [ ] The missing-direction report shows 0 activerecord rows in these files.
- [ ] Tests exercising the restored branches are ported or already green.
