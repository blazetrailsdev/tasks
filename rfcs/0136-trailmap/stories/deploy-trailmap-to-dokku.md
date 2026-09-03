---
title: "Deploy trailmap: dokku app, storage mounts, SSO, loopback API, health"
status: draft
updated: 2026-09-03
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Nothing in the plan deploys trailmap. The repo exists and boots locally, but
several stories assume a running deployment: the database move needs somewhere
to put the file, the mutation API's restart policy needs a supervisor, and the
pages need to sit behind the existing SSO. This is that story, and it has to
land early.

What a deployment needs, from the RFC:

- A dokku app with the same storage mounts ringo has, at identical paths. The
  tasks checkout must be mounted **writable**, because authoring and ingest
  commit into it, and btwhooks' own container already carries a git identity
  for exactly that reason.
- The dashboard on the public hostname behind SSO, and the JSON API bound to
  **loopback only**, unreachable from outside the box.
- A Node 24+ image. The generated `Dockerfile` pins nothing today, and
  `@blazetrails/rack` throws a regex `SyntaxError` at import on Node 20 and 22.
- A health endpoint and a restart policy, which the RFC's availability decision
  depends on — the fleet stops when trailmap is down, and the mitigation is
  that it comes back by itself.

Note the dokku redeploy hazard that has bitten sibling apps: SSO protection has
to be re-applied after a redeploy, and an app holding a fixed port wants
`ps:stop` before deploying.

## Acceptance criteria

- `trailmap` is a dokku app serving its root route over the public hostname,
  behind SSO.
- The JSON API answers on loopback and is refused from the public hostname.
- The tasks checkout is mounted writable, and a commit made by the app lands in
  it with the expected identity.
- A health endpoint exists and the app restarts by itself after a kill.
- The deploy procedure is written down, including the SSO re-apply step.
