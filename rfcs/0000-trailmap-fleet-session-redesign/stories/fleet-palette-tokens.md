---
title: "trailmap: natural palette and type tokens in application.css"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
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
`:root` (`:11`) with a dark set (`:30`). The concept in trailmap#136
(`concepts/redesign/palette.css`) defines the target tokens: terracotta
`#c2603f`, forest `#2f5d46`, mustard `#d4a72c`, soil `#5a3e2b`, clay
`#b9a088`, cream `#faf5ec`, surface `#f4ecde`, ink `#2b211a` / `#6b5a4c` /
`#7a6756`, one color per stage, and Fraunces / Inter / JetBrains Mono.

## Acceptance criteria

- [ ] `:root` carries the palette, the six `--st-*` stage colors and the
      three font tokens; existing token names keep working, or every use is
      renamed in the same PR.
- [ ] A dark set redefines them under `prefers-color-scheme: dark`.
- [ ] Every trailmap page renders with the new tokens and no layout change.
      The dashboard e2e and `class-collisions.test.ts` pass.
- [ ] Body text and muted text meet 4.5:1 contrast on the page background in
      both themes.

## Verification

- `pnpm vitest run test/assets/class-collisions.test.ts` and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) pass.
- A contrast check of `--ink`, `--ink-2` and `--ink-3` on `--bg` in both
  themes, with each ratio quoted in the PR body.
