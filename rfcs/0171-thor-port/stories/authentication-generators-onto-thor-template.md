---
title: "authentication-generators-onto-thor-template"
status: in-progress
updated: 2026-11-01
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - converge-generators-remainder-onto-thor-template
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9569
claim: "2026-11-01T13:01:13Z"
assignee: "app-base-shell-readers-and-run-tasks"
blocked-by: null
closed-reason: null
---

## Context

Split from `converge-generators-remainder-onto-thor-template`, which was sized past the per-PR ceiling.

- `packages/trailties/src/generators/rails/authentication/authentication-generator.ts` overrides `template` (`:64`) over `TEMPLATES` from `rails/authentication/templates.ts`.
- `packages/trailties/src/generators/tse/authentication/authentication-generator.ts` overrides `template` (`:15`) over `TEMPLATES` from `tse/authentication/templates.ts`.

Rails' counterparts are `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/authentication_generator.rb` and `vendor/rails/v8.0.2/railties/lib/rails/generators/erb/authentication/authentication_generator.rb`.

`build:templates` already copies every non-TS file under `src/generators`, so a new `templates/` directory needs no package.json edit.

## Acceptance criteria

- [ ] The in-memory `template` overrides in both authentication generators are deleted, and both call Thor's `template` over source files in their `templates/` directories.
- [ ] `rails/authentication/templates.ts` and `tse/authentication/templates.ts` are deleted.
