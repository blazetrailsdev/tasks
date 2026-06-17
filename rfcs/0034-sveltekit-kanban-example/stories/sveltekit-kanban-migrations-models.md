---
title: "Kanban example: migrations, models, schema dump, seeds"
status: draft
updated: 2026-06-17
rfc: "0034-sveltekit-kanban-example"
cluster: examples
deps: ["sveltekit-kanban-scaffold"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 2 of the SvelteKit Kanban example. Add migrations, the four zero-declare
models, the dumped `db/schema.ts`, and seeds. Domain: Board=RFC, Column=Story
status enum, Card=Story; self-referential `hasMany :through` for dependencies.

## Acceptance criteria

- [ ] Migrations for users, rfcs, stories, story_dependencies in db/migrate/.
- [ ] Models: Rfc (hasMany stories), Story (belongsTo rfc + assignee, enum
      status, integer priority, self-ref hasMany :through dependencies, scopes
      ready/blocked/assignedTo/byCluster, title presence + slug uniqueness),
      User, StoryDependency.
- [ ] `db/schema.ts` dumped; `pnpm typecheck` via `trails-tsc --schema
  db/schema.ts --noEmit` passes (separate from Vite bundling).
- [ ] `db/seeds.ts` loads a sample board.
