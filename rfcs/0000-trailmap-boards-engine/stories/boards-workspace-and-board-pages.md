---
title: "Read-only workspace index and board page"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: ui
packages: []
deps: [boards-mirror-full-reconcile]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The first visible part of the engine. `/boards` lists workspaces and their
boards, with done/total counts using `rfcStoryCounts` semantics. A board page
shows its lists as columns with cards in position order, plus label chips,
member, PR attachment and a dependency-held marker. It is read-only while the
authority is `tasks`.

## Acceptance criteria

- [ ] Engine controllers and `.tse` views for the workspace index and board show
- [ ] Usable at a real 390px viewport (trailmap `CLAUDE.md`)
- [ ] Screenshots in the PR body, against the live mirror
