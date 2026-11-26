---
title: "A tasks ranking change turns every trailmap PR's gate red without warning"
status: ready
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CI's `gate` job checks out blazetrailsdev/tasks at main (.github/workflows/ci.yml:328). tasks@6f2ff42f5 changed `nextBundle`, and every open trailmap PR's gate went red at once until trailmap#197 ported it. Nothing told the tasks author that trailmap's port had to follow.

Expected shape: a change to the tasks repo's `src/ranking.ts` either runs trailmap's gate in the tasks repo's CI, or opens a draft port story automatically, so the port lands before unrelated trailmap PRs go red.

## Acceptance criteria

1. A ranking change in tasks is caught on the tasks side (a CI job or an auto-filed story), not by an unrelated trailmap PR.
