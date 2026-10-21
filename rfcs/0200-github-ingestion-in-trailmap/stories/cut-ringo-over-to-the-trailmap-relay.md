---
title: "Cut over: set relay_to_ringo to audit"
status: ready
updated: 2026-10-21
rfc: "0200-github-ingestion-in-trailmap"
cluster: null
packages: [trailties]
deps:
  [
    show-recent-github-deliveries,
    relay-github-deliveries-to-ringo,
    ringo-audits-direct-hooks-against-the-relay,
    catch-up-missed-deliveries-on-reconnect,
  ]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

The cutover is a row flip. Ringo reads the mode from trailmap, so there's no
second switch to keep in step, and **no hook is touched**: in audit mode the
direct hooks are receipts. Doing it as a trails task, not a shell script,
keeps it going through the models (encrypted settings, the `Event` row).

- add task `ingest:mode <off|audit>` under `lib/tasks`. It writes
  `relay_to_ringo` and an `Event` row (verb `ingest-mode`, detail the new mode,
  actor `$USER`), then prints the resolved mode and the deliveries page's
  current counts
- precondition: Verification 1 holds. The task prints the shadow comparison
  and refuses `audit` unless `--force`.

Rollback: `ingest:mode off`.

## Acceptance criteria

- [ ] `ingest:mode audit` flips the setting, records an `Event`, and ringo picks up the change within its 30 s cache
- [ ] Verification 1's numbers are on the PR
- [ ] After the flip, review relay, CI-fixer and merge teardown are each observed working through the relay
