---
title: "e2e drives the RFC and story pages under Turbo Drive: visits, form submits, refusals, Back"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#206 took the reload opt-out off the RFC list, the RFC page and the story page. Their scripts now rebind on `turbo:load` through a `WeakSet`. Unit tests in happy-dom cover rebinding, including a cloned snapshot. Nothing drives a real browser through the following:

- a Drive visit between those pages,
- a lifecycle form submitted through Drive (303 to the page),
- a refusal (422/409) whose message Turbo renders,
- Back to a cached snapshot, then a control that still works.

## Acceptance criteria

- dashboard-e2e (or a sibling script) visits /rfcs → /rfc/<id> → /story/<id> by clicking links. It asserts one JS session and no `pageerror`.
- It submits a lifecycle form that succeeds and one that is refused, and asserts the refusal text renders.
- After Back, the restored page's sort menu and confirm form still work.
