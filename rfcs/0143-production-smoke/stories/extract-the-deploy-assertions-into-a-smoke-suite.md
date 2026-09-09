---
title: "Extract the deploy assertions into scripts/smoke-prod.sh"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["split-the-health-endpoint-into-liveness-and-readiness"]
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`scripts/deploy.sh` already proves the two things CI cannot: the loopback API
answers 200 rather than the 404 that means `requireLoopback` refused forwarded
headers, and the public vhost answers 30\* rather than serving the dashboard
without SSO. Both have failed in production on their own.

They run once, by hand, at deploy time. This story makes them a suite that can
run on a schedule, and has `deploy.sh` call it instead of inlining its own
copies — the deploy gate becomes "tiers 0 and 1 pass".

Tiers 0 through 2 land here. Tiers 3 through 5 are their own stories.

## Acceptance criteria

- [ ] `scripts/smoke-prod.sh --tier N` runs one tier and exits non-zero on any
      failed assertion
- [ ] Tier 0 checks `/up` on loopback
- [ ] Tier 1 checks `/up/ready`, the loopback 200, and the public vhost 30\*
- [ ] Tier 2 requests every read verb and page and asserts an expected shape,
      not merely a 200
- [ ] `deploy.sh` calls tiers 0 and 1 rather than repeating their curls, and
      keeps its image-id witness unchanged
- [ ] Each assertion prints a stable machine-readable name, so the later
      results table has a key that survives edits to the message

## Definition of done

Weakening `deploy.sh`'s existing checks to make them fit the tiers does not
close this story. The image-id witness and both status assertions survive
verbatim.

## Verification

`./scripts/smoke-prod.sh --tier 1` passes on the box; with `sso:protect`
removed it fails naming the public-vhost assertion.
