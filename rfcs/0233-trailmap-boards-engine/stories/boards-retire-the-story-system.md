---
title: "Retire the story system once nothing reads it"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: retire
packages: []
deps:
  [boards-reverse-mirror, boards-markdown-snapshot-export, boards-adopt-card-terms-in-agent-docs]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 4. Only once 14 days pass with zero old-verb calls (`Action.actor` and
the API log) and zero reads of `index.json` / `events.json`. Delete:

- the reverse mirror;
- `ingest` / `export`;
- the markdown-owned fields and the owned-fields guard;
- the old verbs and routes;
- the `stories` / `rfcs` / `events` tables.

## Acceptance criteria

- [ ] The 14-day zero-usage evidence is linked in the PR
- [ ] trails `CLAUDE.md` "Task state vs. task prose" is replaced
- [ ] `rfcs/` carries a README saying it is a snapshot

## Definition of done

Deleting the tables while any reader remains does not close this story, whatever the date.
