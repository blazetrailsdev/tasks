---
title: "trailmap cannot redeploy while running: the fixed loopback port collides"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap cannot redeploy while it is running, and has not since the first
deploy. `dokku docker-options:report trailmap` shows

```text
Docker options deploy:  -p 127.0.0.1:8080:8080
```

a fixed host-port publish. dokku's docker-local scheduler deploys
zero-downtime: it starts the new container **before** stopping the old one. Two
containers cannot hold `127.0.0.1:8080`, so every release after the first fails:

```text
Error response from daemon: failed to set up container networking:
  Bind for 127.0.0.1:8080 failed: port is already allocated
 !     Could not start due to 1 failed checks (web.1)
! [remote rejected] c2c44308 -> trunk (pre-receive hook declined)
```

The build succeeds and the image is tagged; only the release fails, so the old
container keeps serving and the failure is invisible unless you read the push
output. That is why the box served the PR #1 skeleton while eleven PRs sat
merged: the models, the JSON API, the app shell, the markdown renderer and the
show pages have all been built and thrown away, once per attempted deploy.

**`GIT_REV` does not tell you what is running.** dokku sets it during the
build, so after this failed deploy `dokku config:get trailmap GIT_REV` reports
`c2c44308` while the container still runs the PR #1 image. Confirm with the
image id (`docker inspect trailmap.web.1 --format '{{.Image}}'`) or by looking
for a file only the new code has.

The published port is not incidental — RFC 0136's one-listener design needs it:
"the dashboard, routed by dokku on the public hostname, behind SSO" and "the
JSON API, for the CLI and ringo's Go process, on loopback, bypassing the SSO
that fronts the public hostname". So the fix has to keep a loopback-only API
reachable at a stable address while letting the app deploy.

Options seen so far, none yet chosen:

- **nginx instead of a docker publish** — `dokku proxy:ports-add trailmap
  http:8080:8080`, so nginx listens on 8080 and proxies to the container.
  No host-port collision, so deploys work. But dokku's
  `nginx:set <app> bind-address-ipv4` is per app, not per listener, so binding
  8080 to loopback would also bind the public 80/443 vhost there and take the
  dashboard off the network.
- **Stop before deploying** — the deploy script runs `dokku ps:stop trailmap`
  first. Simple and it works with the port as-is (the deploy pane runs on the
  host as a user who can run dokku), at the cost of real downtime per deploy
  and a window where the CLI and ringo get connection refused.
- **A custom nginx template** giving the app a second server block bound to
  127.0.0.1:8080, keeping the public vhost on all interfaces.

## Acceptance criteria

- Two consecutive deploys of trailmap succeed with the app already running —
  the property that fails today.
- The JSON API stays reachable on loopback at a stable address for the CLI and
  ringo, and stays unreachable from the public hostname without passing SSO.
- The failure mode is loud: a release that does not replace the running
  container fails the deploy visibly rather than leaving a stale container and
  a `GIT_REV` that disagrees with it.
