---
title: "pnpm build typechecks without TRAILS_ENV or a database variable"
status: ready
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md says `pnpm build` is the typecheck. In a plain shell it stops with `trails-tsc: No database file specified. Missing argument: database` (seen in trailmap#172) and passes only with `TRAILS_ENV=test` set. CI's typecheck job has the environment it needs, so a local run fails where CI does not, and an agent can take that for a broken tree.

## Acceptance criteria

- `pnpm build` passes in a fresh worktree with no database variables, or the `build` script in `package.json` sets the environment it needs.
- If the cause is that `trails-tsc` needs a configured database to typecheck, file that as a trailties story (0142-trailties-surfaced-deviations) and link it here.
