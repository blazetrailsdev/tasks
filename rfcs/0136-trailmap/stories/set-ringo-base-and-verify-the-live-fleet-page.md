---
title: "trailmap: set RINGO_BASE and verify the fleet page through nginx and SSO"
status: draft
updated: 2026-10-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#40 made trailmap the fleet page's line to ringo, and was verified in production mode
against a stand-in ringo. The real deployment has not been exercised: the app has no `RINGO_BASE`
(`dokku config:keys trailmap`), so the live page loads and says "No fleet data".

What is already in place: the `fleet` docker network joins the two apps (created 2026-10-06), and
from inside the trailmap container `http://btwhooks.web:8080/events` answers with ringo's stream.

What has only been checked in the smoke boot, not live: the WebSocket handshake through nginx's
`Upgrade` forwarding and the SSO forward-auth, the origin check against the public HTTPS hostname,
and a control POST carrying the session cookie and CSRF token through the same path.

## Acceptance criteria

- [ ] `dokku config:set trailmap RINGO_BASE=http://btwhooks.web:8080` is applied.
- [ ] Signed in through SSO, `https://trailmap.deanoftech.com/dashboard` fills in and its events dot is green.
- [ ] One harmless control (dismiss a failed spawn, or clear failed with none failed) round-trips to ringo.
- [ ] An unauthenticated request to `/fleet/socket` and to `/fleet/control/merge-pr` from off the box is bounced by SSO; record the response.
