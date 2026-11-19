---
rfc: "0000-ringo-changes"
title: "ringo: changes trailmap features need from the fleet process"
status: draft
created: 2026-11-19
updated: 2026-11-19
owner: "@deanmarano"
packages: []
clusters:
  - rfc-sessions
related-rfcs:
  - "0136-trailmap"
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — ringo: changes trailmap features need from the fleet process

## Summary

ringo (the btwhooks Go process, `deanmarano/btwebooks`) owns tmux, the
spawn path and pane I/O. trailmap features that drive agents go through
ringo's HTTP surface (`Setting.ringoBase()`). This RFC collects the ringo-side
changes trailmap stories depend on, one story per capability, so a trailmap
story can name its ringo prerequisite as a `deps` edge instead of carrying
the Go work inside a trailmap PR.

## Motivation

ringo changes have so far been filed inside trailmap RFCs (`0136-trailmap`
holds `deploy-ringo-pane-send-and-sessions-status`,
`bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards`), which mixes two
repos' work in one RFC and hides the ordering. The first feature to need a
dedicated home is the RFC page's discussion session: ringo today can spawn a
one-shot refine or sunset agent (`HandleRFCRefine`,
`webhook/spawnloop.go:3602`; `spawnRFCRefine`, `webhook/rfcautorefine.go:147`)
and type into an existing pane (`/pane/<n>/send`, `main.go:323`), but it has
no session that outlives its tmux pane, no idle reaper, and no way to resume a
Claude session by id. It also does not say which live pane is refining or
sunsetting a given RFC in a form trailmap can query.

## Design

### RFC discussion sessions

A long-running conversational Claude session per RFC, whose tmux pane is
transient. Claude Code accepts `--session-id <uuid>` at start and
`--resume <uuid>` later, so the session's identity is the UUID, not the pane.

- **Start**: `POST /rfc-session/start {slug, sessionId}` spawns Claude in a
  tasks worktree with `--session-id`, primed with the RFC context, and
  answers the pane id. trailmap generates and stores the UUID before calling,
  so the id survives a ringo restart.
- **Send**: `POST /rfc-session/send {slug, sessionId, text}` types into the
  pane; when no pane is live it first respawns with `--resume <sessionId>` in
  the same worktree, waits for the prompt, then sends.
- **Idle reaper**: a pane with no dialog for 5 minutes is closed: `/exit`,
  then `kill-pane`. The worktree and transcript stay. "Dialog" is an operator
  send or a new entry appended to the session's transcript JSONL
  (`~/.claude/projects/<worktree>/<sessionId>.jsonl`), not a change in the
  captured screen, so spinner and clock redraws never hold a pane open.
- **Status**: `GET /rfc-session/status?slug=` answers `live` (pane open),
  `parked` (reaped, resumable) or `none` (never started), with the pane id
  and last dialog time; start/park/resume go out on `/events` so trailmap
  updates without polling.
- **Transcript**: `GET /rfc-session/transcript?slug=&sessionId=` serves the
  session's JSONL messages, so a parked session stays readable without a
  pane.

### In-flight refines and sunsets per RFC

`spawnRFCRefine` already records provenance (`recordRFCSpawnProvenance`) and
registers the spawn (`registerRFCSpawn`). Expose that as
`GET /api/rfc-spawns?slug=` (mode, pane, started, state) and emit
start/finish on `/events`, so the RFC page can show a live refine or sunset
where it runs, through the existing `/pane/<n>/screen` relay. "Recently
finished" is a spawn whose pane exited within the last 30 minutes; older ones
drop off the list (the report is on the Refinements tab by then).

## Non-goals

- **Persisting the session id in ringo:** trailmap's database owns it; ringo
  takes it as an argument.
- **Multiple concurrent sessions per RFC:** one discussion session per RFC.
- **Moving existing ringo stories out of `0136-trailmap`:** the ringo stories
  already there (`deploy-ringo-pane-send-and-sessions-status`,
  `ringo-sends-a-line-of-text-to-a-pane`, `ringo-screen-reports-pane-command`,
  …) stay where they are; their history and PR links are in that RFC. New
  ringo work goes here from this RFC on.
- **The vendored-pin bump and deploy:** that is trailmap work (the pin lives
  in trailmap's `vendor/ringo/PIN`) and stays in `0136-trailmap` as
  `bump-the-ringo-pin-for-rfc-session-endpoints`.

## Alternatives considered

- **Keep the pane open forever:** idle Claude panes hold memory and a usage
  slot; resuming by id costs one cold start.
- **Have trailmap shell out to tmux:** ringo is the one process that owns
  tmux (`0136-trailmap` README, ringo's Go process section).

## Rollout

1. `ringo-rfc-discussion-sessions` and `ringo-reports-in-flight-rfc-refines`
   (independent). trailmap's `rfc-page-discussion-session-tab` can be built in
   parallel against the ringo stub.
2. `bump-the-ringo-pin-for-rfc-session-endpoints` (`0136-trailmap`): deploy
   ringo with both and bump trailmap's vendored pin; depends on both.
3. `rfc-page-discussion-session-tab` closes once it runs against the real
   endpoints; depends on the bump.

## Verification

- Both ringo stories merged, ringo deployed, and trailmap's pin bumped
  (`bump-the-ringo-pin-for-rfc-session-endpoints` done): 3 of 3 prerequisite
  stories done.
- `rfc-page-discussion-session-tab` closes against the deployed endpoints,
  not the stub: on one RFC, a session is started, reaped after 5 idle
  minutes (status `parked`), and resumed by the next message with the earlier
  turns still in the transcript (1 manual run recorded in the story's PR).
- 0 trailmap PRs in this cluster carry Go changes.

## Open questions

None open.

## Changelog

- 2026-11-19: initial RFC
