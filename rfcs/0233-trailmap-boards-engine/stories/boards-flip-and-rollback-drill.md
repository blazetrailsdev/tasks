---
title: "Drill the flip and rollback on a copy of the live database"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: flip
packages: []
deps: [boards-reverse-mirror, boards-ui-writes]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Before the production flip, run the full sequence on a copy of `tasks.db`:

1. Flip to `boards`.
2. Run a scripted day of verbs.
3. Flip back to `tasks`.
4. Flip forward again.

The equivalence gate must pass after every step. Write the runbook in
trailmap `docs/`.

## Acceptance criteria

- [ ] A script runs the sequence and exits non-zero on any gate diff
- [ ] `docs/boards-cutover.md` has the production runbook and its rollback
- [ ] The production flip is the operator's call; this story does not make it
