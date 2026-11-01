---
title: "Move AppGenerator to generators/rails/app/app-generator.ts"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-layout
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9565
claim: "2026-11-01T03:25:05Z"
assignee: "trailties-relocate-app-generator-to-rails-path"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb` scores 0/96 in
parity:api because the port lives at
`packages/trailties/src/generators/app-generator.ts`. The other
`generators/rails/*` ports may be misplaced the same way.

## Acceptance criteria

- `app-generator.ts` (and any sibling under `generators/` whose Rails file
  is under `generators/rails/<name>/`) moves to the conventions path, with
  imports updated and no body change.
- parity:api credits the moved methods. Report the before/after delta in the
  PR body.
