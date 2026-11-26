---
title: "Two tests fail on the dev box on main and pass in CI"
status: ready
updated: 2026-11-26
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

On the dev box, `pnpm test` fails the same two tests on clean main (b849f76) and
on trailmap#176, while CI passes them:
`test/views/rendered-class-collisions.test.ts` ("have no element wearing two classes
that each lay out their own box") and `test/controllers/one-status-vocabulary.test.ts`
("segments the RFC list's bar as a draft"). They likely depend on the local tasks
database or on environment variables. A local red that CI doesn't show reads as a
broken tree.

## Acceptance criteria

- Find what the two tests read from the environment, and make them pass, or skip with a reason, in a plain dev shell.
- `pnpm test` is green on the dev box on main.
