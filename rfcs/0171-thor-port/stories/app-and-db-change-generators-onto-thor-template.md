---
title: "app-and-db-change-generators-onto-thor-template"
status: ready
updated: 2026-10-31
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - converge-generators-remainder-onto-thor-template
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `converge-generators-remainder-onto-thor-template`, which was sized past the per-PR ceiling. `app-generator.ts` and `change-generator.ts` share one in-memory `TEMPLATES` table, so they convert together.

- `packages/trailties/src/generators/app-generator.ts` overrides `template` (`:1525`) over `TEMPLATES` from `rails/app/templates/index.ts`.
- `packages/trailties/src/generators/rails/db/system/change/change-generator.ts` overrides `template` (`:73`) over the same table; Rails' `change_generator.rb:36-38` calls Thor's `template` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/db/system/change/change_generator.rb`).

`build:templates` already copies every non-TS file under `src/generators`, so a new `templates/` directory needs no package.json edit.

## Acceptance criteria

- [ ] The in-memory `template` overrides in `app-generator.ts` and `change-generator.ts` are deleted, and both call Thor's `template` over source files in a `templates/` directory.
- [ ] `rails/app/templates/index.ts` and its `TEMPLATES` table are deleted.
