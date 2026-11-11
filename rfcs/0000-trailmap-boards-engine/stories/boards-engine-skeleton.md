---
title: "Boards engine skeleton mounted by trailmap on its own database"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: engine
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "Where it lives": `engines/boards/` in trailmap, `Boards::Engine`
with `isolateNamespace Boards`, mounted at `/boards`. The only trails engine
precedent is `packages/actionmailbox/src/engine.ts`; no application mounts one
yet. The engine owns a `boards` database (`config/database.ts` entry, SQLite
under `storage/`, `db/boards_migrate`) so it never writes `tasks.db`.

## Acceptance criteria

- [ ] `Boards::Engine` exists, isolated, and `config/routes.ts` mounts it at `/boards`
- [ ] `Boards::ApplicationRecord` is abstract and `connectsTo` the `boards` database
- [ ] `pnpm db:migrate` (no flag) migrates `boards` alongside `primary` and `hub`
- [ ] `/boards` renders an engine view through an engine route helper
- [ ] Every framework defect found is a trails story, not a trailmap workaround

## Definition of done

A route or view added directly to the host app instead of the engine does not close this story.
