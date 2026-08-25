---
title: "Recover awaits on receivers with local async provenance"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 5828
claim: "2026-08-01T21:16:04Z"
assignee: "codegen-await-local-receiver-inference"
blocked-by: null
closed-reason: null
---

## Context

PR #5822 narrowed await insertion to self-receivers
(`scripts/prism-codegen/await-policy.ts`): anything reached through a local, a
param, an ivar, a constant, or a call chain is now left bare. That is the right
default while receiver types are unknown — a spurious await in a hot sync path
is a behavioural change once output is applied.

It trades false positives for false negatives. Calls like `@relation.load` or a
local bound to a relation are genuinely async in the port and now emit bare.
Under `codegen-apply-scaffolding` a _missing_ await is worse than a spurious
one: it silently yields a pending promise where a value is expected.

## Acceptance criteria

- Receivers whose type the generator can establish locally earn an await again:
  at minimum an ivar or local assigned from a self-call whose name is in the
  async manifest, tracked within the enclosing def.
- The conservative default stands for receivers with no local evidence.
- Tests cover an ivar assigned from an async self-call (awaited on later use)
  and an ivar of unknown provenance (left bare).
- `pnpm codegen:score` matched count does not regress; goldens regenerated and
  every newly added await justified in the PR body.
