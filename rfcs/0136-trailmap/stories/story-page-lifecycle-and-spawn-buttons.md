---
title: "story-page-lifecycle-and-spawn-buttons"
status: done
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - rfc-page-lifecycle-buttons-and-ready-all-drafts
deps-rfc: []
est-loc: 220
priority: null
pr: trailmap#98
claim: "2026-10-30T09:56:35Z"
assignee: "split-the-render-pages-the-rails-way-story"
blocked-by: null
closed-reason: null
---

## Context

`render-the-rfc-and-story-show-pages` (trailmap#11) ported `/story/<id>` as a
read; `app/controllers/story-pages-controller.ts:89` lists the action buttons
as left behind. ringo's story page renders them at btwebooks
`webhook/story.go:670-672`, routed in `main.go:345-347`:

- "Mark ready" → `/spawnloop/story-ready` (`HandleStoryReady`), shown when
  `CanReady`.
- "Top of queue" → `/spawnloop/story-top` (`HandleStoryTop`), shown when
  `CanTopQueue`.
- "Spawn worker" → `/spawnloop/story-spawn` (`HandleStorySpawn`), shown when
  `CanSpawn`, with the confirm "Spawn a worker for <id> now, using the current
  loop settings?".

The database writes already exist in trailmap as POSTs
(`config/routes.ts:157-165`: `status-set`, `priority`, `block`, `close`,
`release`, …, from `serve-the-mutation-verbs-as-json`); nothing on the page
calls them. Spawning starts an agent, so it is ringo's dispatch and goes through
the `fleet/control/*path` relay (`config/routes.ts:56`), as the dashboard's
manual spawn does.

## Acceptance criteria

- `/story/<id>` renders "Mark ready" and "Top of queue" under the same
  conditions as ringo's `CanReady` / `CanTopQueue`, calling trailmap's own
  mutation endpoints (`status-set --from draft`, `priority`) instead of
  ringo.
- `/story/<id>` renders lifecycle buttons for the remaining story verbs the
  page can sensibly offer (block, close, release a stale claim), each backed by
  the existing mutation endpoint, with the CLI's refusals shown as the error.
- "Spawn worker" is relayed to ringo's `story-spawn` through `fleet/control`,
  with ringo's confirm text; trailmap adds no spawn logic.
- Controller tests cover each button's visibility condition and a refusal.

## Note on the mutation endpoints

The criteria say the buttons call trailmap's mutation endpoints. trailmap#98 adds
page POSTs that run the same model verbs instead, as trailmap#94 did for RFCs:
the endpoints are loopback-only JSON, and a refusal has to render on the page.
