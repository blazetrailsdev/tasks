---
title: "Uptime Kuma monitors trailmap web over the fleet network and a test hang alerts within 2 minutes"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#210 shipped the hang diagnostic (`NODE_OPTIONS=--report-on-signal`) and documented the alert in docs/deploy.md, "Detecting a hang". It did not perform the operator steps, so `web-hang-is-detected-and-diagnosed` AC1 is unmet: `uptime-kuma.web.1` is only on `bridge`, not on `fleet`, and no monitor exists. From the fleet network `trailmap.web` resolves (172.23.0.5); `trailmap.web.1` is renamed during deploys, so do not use it.

## Acceptance criteria

- `dokku network:set uptime-kuma attach-post-deploy fleet` is applied, and Kuma resolves `trailmap.web`.
- A Kuma HTTP monitor on `http://trailmap.web:8080/up` (30s interval, 10s timeout, 2 retries) has the box's notification attached.
- A deliberate event-loop block on trailmap web (or a `docker pause trailmap.web.1`) fires that notification within 2 minutes, and the time it took is recorded in docs/deploy.md.
- After that, `web-hang-is-detected-and-diagnosed` is marked done with `--pr trailmap#210`.
