---
title: "Assert the migration head in the readiness probe"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["split-the-health-endpoint-into-liveness-and-readiness"]
deps-rfc: []
est-loc: 150
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A deploy replaces the container. If a migration did not run, every page still
renders and every probe stays green — and the ready queue silently returns the
wrong rows to the spawn loop. This is the one silent fleet-stopper with no
current detector, and it is the reason `/up/ready` exists.

The comparison needs the deployed code to know the head it expects. Whether
that is baked at build time or read from `db/migrate` at boot is a trails
question as much as a trailmap one — RFC open question 4 — and resolving it is
part of this story.

## Acceptance criteria

- [ ] `/up/ready` compares the `schema_migrations` head against the head the
      deployed code expects and fails when they differ
- [ ] The failure names both versions, not just "mismatch"
- [ ] The mechanism for knowing the expected head is documented in the source
      with the reason for the choice
- [ ] A test with a deliberately un-migrated database turns the check red
- [ ] If trails has no supported way to ask for the expected head, a trails
      story is filed and linked here rather than worked around

## Verification

Roll the database back one migration; `/up/ready` answers 503 naming both
versions. Migrate forward; it answers 200.
