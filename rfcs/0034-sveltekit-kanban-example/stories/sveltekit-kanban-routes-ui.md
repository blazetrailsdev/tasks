---
title: "Kanban example: routes, form actions, API, Svelte UI"
status: draft
updated: 2026-06-17
rfc: "0034-sveltekit-kanban-example"
cluster: examples
deps: ["sveltekit-kanban-migrations-models"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 3 of the SvelteKit Kanban example. Build the routes and UI: board `load`
functions with `includes` eager loading, form actions for create/move/claim/
reorder (each wrapped in `Base.transaction`), a `+server.ts` JSON API route, and
the Svelte columns/cards. Validations render as form-action field errors via
`fail(422, { errors })`.

## Acceptance criteria

- [ ] `routes/+page.server.ts` lists boards; `routes/[rfc]/+page.server.ts`
      loads one RFC with `includes(stories, assignee)`.
- [ ] Form actions: createStory, moveStory (column change), claimStory,
      reorder — each a `Base.transaction(...)`.
- [ ] RecordInvalid / failed validation → `fail(422, { errors })`, rendered as
      inline field errors in `[rfc]/+page.svelte`.
- [ ] `routes/api/stories/+server.ts` returns JSON.
