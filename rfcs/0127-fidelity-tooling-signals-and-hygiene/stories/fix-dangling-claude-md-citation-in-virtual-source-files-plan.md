---
title: "Fix the dangling CLAUDE.md citation in virtual-source-files-plan.md"
status: draft
updated: 2026-10-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`docs/infrastructure/virtual-source-files-plan.md:20` cites a CLAUDE.md section
titled "The declare pattern for typed runtime-attached members". No heading of
that name exists in `CLAUDE.md` on main (checked after trails#8691 merged; it
was already dangling before that PR). The `declare` reference that survives is
README.md's `declare` / associations / enums / schema section, which the root
CLAUDE.md intro points at.

## Acceptance criteria

- The citation at `docs/infrastructure/virtual-source-files-plan.md:20` points
  at a heading that exists (README.md's `declare` reference, or whichever doc
  now holds the pattern), or the sentence is dropped.
- A scan of `docs/` for CLAUDE.md section-title citations finds no title absent
  from `CLAUDE.md` (the check trails#8691 ran over `packages/`, `scripts/` and
  `eslint/`, extended to `docs/`).
