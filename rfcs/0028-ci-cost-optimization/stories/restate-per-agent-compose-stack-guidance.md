---
title: "Restate the per-agent compose-stack guidance now that the run token handles concurrency"
status: ready
updated: 2026-07-30
rfc: "0028-ci-cost-optimization"
cluster: null
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

Before PR #5638, two concurrent AR runs against one PG or MySQL server corrupted
each other: `globalSetup` dropped and recreated the un-stamped slot databases
while a sibling run's workers were connected to them. The documented workaround
was for every agent to hand-roll a per-agent `docker compose -p <slug>` stack on
edited ports, which several agents got wrong.

PR #5638 removed the need for that: slot database names and advisory-lock keys now
carry a per-run token, and two concurrent runs against one server on default
ports were verified to pass on both lanes.

The guidance has not caught up. Any prose that still tells agents an isolated
compose project is _required_ for correctness now overstates the case — it is
still useful for isolating a server's data or pinning a version, but it is no
longer the thing standing between two agents and a corrupted run.

## Acceptance criteria

- Locate the local-development guidance that mandates a per-agent compose stack
  for PG and MySQL runs and restate it accurately: concurrency-safety is now
  handled by the run token; an isolated stack is an option, not a prerequisite.
- Keep whatever reasons for an isolated stack remain genuine (server version
  pinning, data isolation, avoiding a shared server outright).
- Do not touch `docs/activerecord/`, which is frozen under RFC 0011 Phase 4.
