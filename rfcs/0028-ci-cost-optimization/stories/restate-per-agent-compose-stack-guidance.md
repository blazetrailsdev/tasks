---
title: "Restate the per-agent compose-stack guidance now that the run token handles concurrency"
status: closed
updated: 2026-08-07
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
closed-reason: "Premise gone on origin/main (311bff350): there is no in-tree guidance left mandating a per-agent compose stack. 'docker compose -p', 'COMPOSE_PROJECT_NAME' and 'per-agent' have zero hits across all *.md; README.md:262-284 is the only local-DB setup prose and it already says the opposite — 'a local server on default ports needs only ARCONN' and 'docker compose up is all a local run needs'. docs/activerecord/ (frozen, and excluded by this story anyway) has no 'docker' hit either. The stale mandate PR #5638 obsoleted survives only in agent-side memory files outside this repo, which this story cannot reach. Nothing to restate."
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
