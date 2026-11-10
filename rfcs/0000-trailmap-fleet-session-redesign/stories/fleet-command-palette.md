---
title: "trailmap: ⌘K palette over sessions, stories, PRs and actions"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-search
packages: []
deps: [fleet-session-list, fleet-session-bundle-stories]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The concept (trailmap#136, `b-stepper-list.html?search=1`) shows the
palette: grouped results for Sessions, Stories, Pull requests and Actions,
scope chips by kind and repo, match highlighting and keyboard hints. Broadcast
and Spawn move into its actions, so `fleet-top-panels-grid`'s two header
buttons open it.

## Acceptance criteria

- [ ] ⌘K / Ctrl+K and the header search open the palette, and Esc closes it.
- [ ] It searches the page's sessions and PRs locally and stories through a
      tasks database lookup, grouped by kind, with the top result selected.
- [ ] ↑/↓ move, ↵ opens, ⌘↵ messages the selected session. Scope chips filter
      by kind and repo.
- [ ] The Message, Spawn and Broadcast actions use the existing control
      requests, and the header Broadcast and Spawn buttons open the palette
      on those actions.
- [ ] It is a dialog with focus trapped while open.
