---
title: "Cut ringo over: relay on and ringo's GitHub hooks off, in one step"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: []
deps:
  [
    run-gh-webhook-forward-as-an-ingest-process,
    show-recent-github-deliveries,
    relay-github-deliveries-to-ringo,
  ]
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

This is an operational story. The code is mostly a script that makes the flip
atomic and reversible.

1. **Shadow sign-off.** For at least 24 h with the relay off, trailmap's
   repo × event counts (`/deliveries`) match each ringo hook's `/deliveries`
   for the same window, within what a restart window explains. Record the
   numbers on the PR.
2. **Flip, in one command:** set `relay_to_ringo` on and PATCH hooks
   602873770 (trails), 670781774 (tasks) and 674688087 (trailmap) to
   `active: false`. If both paths are on, ringo acts on every event twice,
   and GUIDs differ so it can't dedupe.
3. **Watch** for a day: reviews reach coder panes, the CI-fixer fires on a red
   main, merges tear down panes.

Rollback is the same script reversed: hooks back on, relay off.

## Acceptance criteria

- [ ] The shadow counts are on the PR
- [ ] `scripts/ringo-cutover.sh on|off` flips both together and prints the resulting state
- [ ] After the flip, the three hooks' `/deliveries` show nothing new, and ringo's logs show relayed events being handled
- [ ] Review, CI-fixer and merge-teardown each observed working once after the flip
