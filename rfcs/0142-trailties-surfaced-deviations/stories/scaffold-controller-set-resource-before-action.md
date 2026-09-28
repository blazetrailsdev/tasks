---
title: "scaffold-controller-set-resource-before-action"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `orm_class` / `orm_instance` (trails#8217). Rails' scaffold controller templates
(`railties/lib/rails/generators/rails/scaffold_controller/templates/controller.rb.tt` and
`api_controller.rb.tt`) declare `before_action :set_<singular>, only: %i[ show edit update destroy ]`.
They also define a private `set_<singular>` that does `@<singular> = <%= orm_class.find(class_name, "params.expect(:id)") %>`,
and the actions communicate through ivars with implicit rendering.

`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`
(`crudMethods` / `apiCrudMethods`) inlines the `find` into each of show/edit/update/destroy instead. It passes the
record as a `locals:` entry to an explicit `this.render({ action })`, and it emits no `setX` method or
`beforeAction` registration. `rails/scaffold/scaffold-generator.ts` carries a second copy of the old
commented-out bodies.

## Acceptance criteria

- The emitted controller registers `beforeAction("set<Singular>", { only: [...] })` and defines a
  `set<Singular>()` method holding the `ormClass.find(...)` call, matching Rails' action lists for the HTML and API
  templates.
- Actions no longer repeat the `find`.
- `scaffold-generator.ts` emits through the scaffold controller generator (or its bodies) instead of its own
  commented-out copy.
