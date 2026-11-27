---
title: "A hung trailmap web process is detected internally and leaves a diagnostic report"
status: in-progress
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trailmap#210
claim: "2026-11-27T14:14:30Z"
assignee: "web-hang-is-detected-and-diagnosed"
blocked-by: null
closed-reason: null
---

## Context

On 2026-11-25 at 19:12 UTC, trailmap's web process stopped answering. Even `curl http://localhost:$PORT/` from inside the container timed out after 30 s, while the worker kept running. The last lines it logged were `Completed 504 Gateway Timeout` on `FleetController#read` (`/fleet/read/spawn-loop`), which relays reads to ringo. It stayed hung for over 15 minutes, until `dokku ps:restart trailmap web`.

Nothing noticed. The public URL kept answering 302, because Authelia's SSO redirect sits in front of the app. The root cause was never confirmed. The working guess was held fleet-read relays piling up behind a slow ringo, and trailmap#203 (cached and coalesced ringo reads) addressed that guess, but it is still a guess.

## Shape expected

- An internal liveness check that bypasses SSO: an Uptime Kuma HTTP monitor on the dokku `fleet` network against trailmap's `/up`, with a short timeout and a notification.
- On a hang, a diagnostic is captured before any restart: an event-loop and active-handle dump (e.g. `process.report.writeReport()` via a signal, or the `--report-on-signal` flag), so the next hang has a cause.

## Acceptance criteria

- Blocking trailmap's web event loop fires an alert within 2 minutes.
- A documented one-liner in `docs/deploy.md` captures a diagnostic report from a hung web process.
