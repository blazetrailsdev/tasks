---
title: 'trailmap: gate:lists is red — /backlog prints "~0 LOC" for an est-loc of 0, ringo prints nothing'
status: done
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: trailmap#46
claim: "2026-10-08T20:25:01Z"
assignee: "backlog-row-prints-a-zero-est-loc-ringo-omits"
blocked-by: null
closed-reason: null
---

## Context

trailmap's `gate` CI job is red on `pnpm gate:lists` (`scripts/gate-ringo-lists.ts`), and the gate is a
merge condition, so every open trailmap PR is blocked on it. First seen on trailmap#45, which touches
no backlog code:
<https://github.com/blazetrailsdev/trailmap/actions/runs/37836837643/job/113515902316>

```text
NOT EQUIVALENT — 3 differences:
  /backlog?icebox: audit-inherited-hooks-for-an-inlined-from-entry: estLoc: ringo="" trailmap="0"
  /backlog?icebox: claude-md-section-for-inlined-module-initialize: estLoc: ringo="" trailmap="0"
  /backlog?icebox: sample-class-constructors-for-the-hoisted-super-case: estLoc: ringo="" trailmap="0"
```

All three stories are in RFC 0188 and carry `est-loc: 0`. `main` last passed the gate at b685906,
before they existed in the tasks data CI fetches; nothing in trailmap changed.

Likely cause (read, not yet reproduced): `app/views/story-pages/index.html.tse` prints the estimate
when `row.estLoc !== null`, so a story whose estimate is `0` renders `~0 LOC`. ringo's Go renderer
omits a zero estimate. `app/views/rfc-pages/show.html.tse` has the same `!== null` test on
`story.estLoc` and may differ from ringo in the same way.

## Acceptance criteria

- Reproduce first: `pnpm gate:lists` against current tasks data shows the three differences on `main`.
- Confirm in ringo's source (at the pin `gate:lists` prints) what it does with a zero `est-loc`, and
  make trailmap's `/backlog` rows say the same. Do not change the gate's extraction to hide it.
- Check the RFC show page's story rows for the same difference and fix it there if it exists
  (`pnpm gate:pages` / `pnpm gate:snapshot` cover that page).
- A test in `test/controllers/` pins the zero-estimate row.
- `pnpm gate`, `pnpm gate:lists`, `pnpm gate:snapshot` and `pnpm test` pass; `gate` is green on the PR.
