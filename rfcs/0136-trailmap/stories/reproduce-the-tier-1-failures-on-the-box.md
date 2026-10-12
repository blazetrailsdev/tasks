---
title: "Reproduce the tier 1 failures on the box, not only in the self-test"
status: blocked
updated: 2026-10-12
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
blocked-by: "Operator-run, not for an unattended agent: one criterion takes sso:protect off the public vhost 'in a controlled window', which exposes a dashboard whose controls relay merge and spawn to ringo. The owner picks the window (2026-10-12 refine). The other two criteria (tier 1 green after trailmap#55's deploy; a COPY of tasks.db one migration behind) are safe; /up/ready migrations is already green on the box."
closed-reason: null
---

## Context

RFC 0143's Verification asks that each failure be "reproduced deliberately
once and must turn a tier red". For the assertions `scripts/smoke-prod.sh`
took over from `deploy.sh` (trailmap#55), that was done only in `--self-test`,
against a canned `curl`. Two lines of the two stories' Verification sections
were never run on the box:

- `extract-the-deploy-assertions-into-a-smoke-suite`: "with `sso:protect`
  removed it fails naming the public-vhost assertion"
  (`tier1.public-vhost-redirects`).
- `assert-the-migration-head-in-the-readiness-probe`: "Roll the database back
  one migration; `/up/ready` answers 503 naming both versions." Covered by a
  unit test with a real rollback on an in-memory database, not against the
  deployed container and the live `tasks.db`.

Also unconfirmed at merge: `tier1.migration-head` was red on the box because
the running release predated the check. The first deploy after trailmap#55
runs tiers 0 and 1 from `deploy.sh` and should turn it green.

## Acceptance criteria

- [ ] After the deploy that ships trailmap#55, `./scripts/smoke-prod.sh --tier 1`
      is run on the box and all five assertions pass; the output is recorded
- [ ] With SSO taken off the public vhost in a controlled window, tier 1 fails
      naming `tier1.public-vhost-redirects`, and passes again once
      `dokku sso:protect trailmap` is re-applied
- [ ] Against a COPY of `tasks.db` one migration behind (never the live file),
      a container pointed at it answers 503 from `/up/ready` naming both
      versions
- [ ] Any assertion that does not go red when its failure is reproduced is
      filed as its own story
