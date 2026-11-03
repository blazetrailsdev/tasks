---
title: "rails-to-trails-repo-wide-rename"
status: draft
updated: 2026-11-03
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

Repo owner ruling, 2026-11-02: one mechanical PR, no RFC. Everything in trails named Rails/rails becomes
Trails/trails unless it references the Ruby framework or is an explicit interop feature.
`scripts/parity/conventions.ts:53` `TOKEN_RENAMES` gains the token, the way erb -> tse works, and
`packages/trailties/src/index.ts:20` `TopLevel.Rails = Trails` goes if nothing needs it.

## Acceptance criteria

- `Rails`/`rails` are in `TOKEN_RENAMES`, whole tokens only, and `docs/ruby-ts-conventions.md` is regenerated.
- Test names, user-facing strings, identifiers, paths and generated class paths are renamed; class paths by regeneration.
- Tags, parity tooling, vendor citations, rails-dom-testing, prose about Rails and interop stay; kept interop is listed in the PR body.
- Parity gates show non-negative deltas with no baseline or allowlist widened.
