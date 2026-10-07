---
title: "trailmap: restore camelCase route targets once trails#8640 is vendored"
status: draft
updated: 2026-10-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8640 made an action go by its method's name. trailmap#41 (the bump to trails `de247517c9`)
had to do the opposite, because that pin still has trails#8573's Rails-spelled action names: four
route targets in `config/routes.ts` became `stories#next_bundle`, `mutations#in_progress`,
`#record_spawn`, `#status_set`; the controller tests that name those actions followed; and
`CLAUDE.md` gained a paragraph explaining an exception to "camelCase, everywhere".

All of that is to be undone by the next bump.

## Acceptance criteria

- [ ] `vendor/TRAILS_PIN` is at or after trails#8640's merge commit (bumping is its own PR).
- [ ] `config/routes.ts` names the four actions `nextBundle`, `inProgress`, `recordSpawn`, `statusSet`, and the comment above the first is gone.
- [ ] `test/routes.test.ts`, `test/controllers/mutations-controller.test.ts` and `test/controllers/stories-controller.test.ts` use the method names.
- [ ] The "One thing that looks like an exception" paragraph is removed from `CLAUDE.md`.
