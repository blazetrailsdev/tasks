---
title: "Polymorphic routes call model.persisted() where trails spells persisted? as isPersisted()"
status: ready
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
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

Found re-verifying the README quickstart (trails#8195) on `main` at `bace3edab4`.
`formWith({ model: post })` in a scaffolded `new` / `edit` view fails:

```text
TypeError: model.persisted is not a function
```

`HelperMethodBuilder#handleModel` (`packages/actionpack/src/action-dispatch/routing/polymorphic-routes.ts:309-313`)
and the `handleList` arm at `:351` call `model.persisted()`, and the model type
declares `persisted(): boolean` (`:14`). Rails calls `model.persisted?`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/polymorphic_routes.rb:274,324`),
which trails spells `isPersisted()` (ActiveModel / ActiveRecord). So every polymorphic
URL for a real record throws. Adding `persisted() { return this.isPersisted(); }` to the
model gets past it, which confirms the cause.

## Acceptance criteria

- Polymorphic routes call `isPersisted()`, the trails spelling of `persisted?`, and the model
  type declares it. No `persisted()` alias is added to models.
- A test builds a polymorphic path for a persisted and a new ActiveRecord record.
