---
title: "Spawn loop panel: last spawn time and next-spawn countdown"
status: done
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#88
claim: "2026-10-28T12:04:01Z"
assignee: "port-pr-82-to-the-rails-twin"
blocked-by: null
closed-reason: null
---

## Context

btwhooks' dashboard spawn-loop panel now shows, while the loop is running,
"last spawn at <time> (<ago>) · next spawn in <N> min" (btwhooks 44603ba).
trailmap should show the same so the port stays at parity.

## What to build

- The spawn-loop status payload exposes `last_spawn_at` (most recent tick
  whose outcome was "spawned") and `next_tick_at` (last tick time + stagger;
  empty when the loop is disabled or has no stagger).
- The spawn-loop panel, when the loop is enabled, renders
  "last spawn at <local h:mm> (<time ago>) · next spawn in <N> min", or
  "next spawn due now" once the countdown reaches zero.
- When the loop is paused, show only "latest: <time ago>" and no countdown.

## Acceptance criteria

- [ ] Status includes `next_tick_at`, computed from the last tick and the
      stagger, so a stagger change mid-interval counts from the last tick
      rather than restarting.
- [ ] Running loop shows both the last-spawn time and the next-spawn countdown.
- [ ] Paused loop shows no countdown.
- [ ] Test covering `next_tick_at` for enabled, disabled, and zero-stagger.
