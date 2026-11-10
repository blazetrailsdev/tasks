---
title: "trailmap: show a spawn's reported Self review stage"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-stage-signal
packages: [actionview]
deps: [fleet-session-stage, fleet-session-bundle-stories, tasks-session-stage-verb]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`sessionStage` takes an optional reported stage and honors it for a spawn
with no PR only (RFC "A session and its stage"). `tasks-session-stage-verb`
adds the field. This story reads it into the page.

## Acceptance criteria

- [ ] `fleet/stories` answers each story's `stage`, and also answers for a
      spawn's `story` id (`?story=<id>`), since a spawn has no PR yet.
- [ ] The page passes the spawn's reported stage to `sessionStage`.
- [ ] A spawn whose story reports `self` renders Self review, and a merged PR
      whose story still reports `self` renders Merged.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` and `pnpm vitest run test/controllers/fleet-controller.test.ts`
  for both fixtures.
