---
title: "Equivalence gate: boards answers ready, next-bundle, list and show as the task domain does"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: mirror
packages: []
deps: [boards-mirror-full-reconcile]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's phase-3 entry condition. Same idea as trailmap's `pnpm gate`
(`scripts/equivalence.ts`): over one database, the Boards-side ready queue,
bundle, filtered list and per-card show must match `Story.readyQueue`,
`Story.bundle`, `Story.listFiltered` and the story show data byte for byte,
after id mapping.

## Acceptance criteria

- [ ] `pnpm gate:boards` exits non-zero on any differing row and prints the diff
- [ ] It runs in CI against a fixture database
- [ ] A nightly job runs it against the live mirror and mails a non-empty diff
- [ ] Rows are compared as well as ids (see `gate-the-list-rows-values-not-just-their-ids`)
