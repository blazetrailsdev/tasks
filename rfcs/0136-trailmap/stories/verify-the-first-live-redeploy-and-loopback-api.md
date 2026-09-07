---
title: "Run the first live redeploy on the box and prove the loopback API answers"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

## Acceptance criteria

## Definition of done

## Verification

## Context

PR #16 fixed the two remaining defects in code, but nothing in it has been
proved against the live box — the fix only takes effect on the next deploy
from `main`, and no deploy was run.

At merge time the box was serving a stale image, with:

```
$ curl -s http://127.0.0.1:8080/up            # unguarded
{"status":"ok"}
$ curl -s http://127.0.0.1:8080/stories/ready # every requireLoopback endpoint
{"error":"not_found"}
```

The 404 is nginx's loopback `server` block setting `X-Forwarded-For` and
`X-Forwarded-Proto`, which `requireLoopback`
(`app/controllers/concerns/loopback-only.ts:19-25`) treats as disqualifying.
PR #16 removes those headers from `nginx.conf.sigil`, but the template only
reaches nginx on a deploy.

`dokku docker-options:report trailmap` was already empty at merge time, so the
host-port collision itself is gone; what is unproved is the redeploy property
and the API's restoration.

## Acceptance criteria

- `./scripts/deploy.sh` run on the box, twice in a row, with the app running
  throughout — both runs exit 0. The second run is the one that proves the
  redeploy property; the first may be the one that installs the new template.
- After the deploys, `curl -s http://127.0.0.1:8080/stories/ready` returns the
  ready queue, not `{"error":"not_found"}`.
- The public hostname still redirects to auth (302), i.e. the SSO injection
  survived the template change — `scripts/deploy.sh` asserts this, so a green
  run is the evidence.
- The running image id (`docker inspect trailmap.web.1 --format '{{.Image}}'`)
  differs from the one recorded before the first deploy, confirming the box is
  finally off the PR #1 image.
