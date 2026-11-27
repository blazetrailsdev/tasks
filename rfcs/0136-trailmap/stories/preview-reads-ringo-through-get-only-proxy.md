---
title: "Previews read ringo through a GET-only proxy"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Surfaced on trailmap#199/#201. Previews have no ringo data: `scripts/preview.sh` sets no `RINGO_BASE` and clears `settings`, so /deploys, /sessions and the fleet pages are empty on a preview.

Proposal (not yet agreed with the owner):

- A `ringo-readonly` dokku app on the box: nginx proxying `btwhooks.web:8080`, refusing anything but GET with a 403, on the `fleet` network.
- `preview.sh` sets each preview's `RINGO_BASE` to it.
- The preview is still never on `fleet` itself, so read-only is enforced outside the PR's code.
- Both apps hide the fleet controls (`fleet#control`, `#message`, `#keys`, all POSTs) and show a "read-only preview" note when `TRAILMAP_PREVIEW` is set.

First, audit ringo's GET routes for side effects. If any exist, the proxy needs an allowlist of paths instead of "all GETs". Document the proxy's setup in `docs/deploy.md`.
