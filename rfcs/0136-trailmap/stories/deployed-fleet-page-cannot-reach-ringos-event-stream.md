---
title: "trailmap: the deployed fleet page cannot reach ringo's event stream or its control endpoints"
status: in-progress
updated: 2026-10-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: trailmap#40
claim: "2026-10-06T16:45:13Z"
assignee: "deployed-fleet-page-cannot-reach-ringos-event-stream"
blocked-by: null
closed-reason: null
---

## Context

The deployed fleet page (`https://trailmap.deanoftech.com/dashboard`) renders its shell and never
fills in. Checked on 2026-10-05 against the live container at `d513b9c`:

- The page carries `data-events-url="/events"`, the default of `RINGO_EVENTS_URL`
  (`config/fleet.ts`); the deployment sets no value (`dokku config:keys trailmap`).
- `GET /events` on trailmap answers 404. trailmap does not serve the stream, by design
  (`docs/fleet-dashboard.md`, "Where the SSE connection points").
- `docs/fleet-dashboard.md` calls same-origin "the supported deployment", "correct when the SSO
  reverse proxy routes both processes under one host". Nothing does: `nginx.conf.sigil` has no
  location that sends `/events`, or any control path, to ringo, and ringo lives on its own host
  (`ringo.deanoftech.com`).
- Pointing `RINGO_EVENTS_URL` at ringo's host does not work either: ringo's `/events` sends no CORS
  headers (confirmed with an `Origin:` request), and the page opens the stream with credentials.

So the page has never been able to render in deployment. trailmap#38 fixed a second, independent
fault (the script arriving truncated); this is the first.

The same routing carries the page's WRITES. Since trailmap#37 the page posts to `/spawn`,
`/merge-pr`, `/spawnloop/dismiss`, `/spawnloop/dismiss-failed` and `/ci-fixer/spawn`, all resolved
against the events URL's origin.

## The constraint that makes this a design decision

Whatever routes these paths must put them behind SSO. The sso plugin injects its auth directives
only into root-prefix location blocks of the public server block (see the long comment in
`nginx.conf.sigil`); a new `location /events` or `location /merge-pr` added there is NOT covered
by that injection. Done naively this publishes ringo's event stream and an unauthenticated merge
button to the internet.

Options to decide between:

1. Route the paths in trailmap's public server block to ringo, with authentication proven on each
   new location (and `scripts/check-nginx-sigil.sh` extended to assert it).
2. Add credentialed CORS to ringo for trailmap's origin and set `RINGO_EVENTS_URL` to ringo's
   host. The stream would work; the JSON POSTs need a preflight, which carries no cookie and so is
   bounced by SSO unless OPTIONS is exempted.
3. Proxy through trailmap after all, reversing the decision in `docs/fleet-dashboard.md`.

## Acceptance criteria

- [ ] The deployed fleet page fills in from ringo's stream, and its controls reach ringo.
- [ ] An unauthenticated request to every routed path, from off the box, is refused; a check asserts it.
- [ ] `docs/fleet-dashboard.md` describes the deployment that exists.
