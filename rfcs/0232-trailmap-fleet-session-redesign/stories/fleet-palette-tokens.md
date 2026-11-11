---
title: "trailmap: palette, stage marks and type tokens in application.css"
status: draft
updated: 2026-11-11
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-shell
packages: [actionview]
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

`app/assets/stylesheets/application.css` (932 lines) defines its colors on
`:root` (`:11`) with a dark set (`:30`). The RFC's "Palette and type" table
gives every light value, including the six stage marks, one saturated hue
each. The dark set is not designed yet (RFC open question 4). The concept is
trailmap#136 (`concepts/redesign/palette.css`).

## Acceptance criteria

- [ ] `:root` carries every token in the RFC's table, the six `--st-*` stage
      marks and the three font tokens. Existing token names keep working, or
      every use is renamed in the same PR.
- [ ] The old dark set is removed, so no page renders the old palette in
      dark mode; dark comes back in its own story.
- [ ] A unit test over the token values asserts 4.5:1 for each text token
      and 3:1 for each stage mark, against the background and the surface.
- [ ] Every trailmap page renders with the new tokens and no layout change.

## Verification

- `pnpm vitest run test/assets/class-collisions.test.ts`, the new contrast
  test, and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job).
