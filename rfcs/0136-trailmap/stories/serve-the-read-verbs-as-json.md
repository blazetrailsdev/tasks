---
title: "Serve the read verbs as JSON on loopback"
status: in-progress
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["move-ranking-onto-story-scopes"]
deps-rfc: []
est-loc: 200
priority: 5
pr: 5
claim: "2026-09-05T17:46:44Z"
assignee: "serve-the-read-verbs-as-json"
blocked-by: null
closed-reason: null
---

## Context

The read verbs are the safe half of the API and the half ringo needs first:
`ready`, `next-bundle`, `list`, `show`, `touching`. They map onto the model
work from the ranking story, and they replace two separate consumers at once —
`tasks/src/readmodel.ts`'s published JSON, and `webhook/tasksdb.go`'s ~400
lines of Go reproducing it.

Serve them from the same controllers as the HTML pages, `Accept`-negotiated,
per the RFC's one-listener design: dashboard on the public hostname behind SSO,
JSON on loopback.

The response shapes are not a design exercise — they must match what the
consumers already parse, because the Go side and the CLI both have concrete
expectations today. `readmodel.ts` is the specification to reproduce; the
existing `/spawnloop/rfcs` JSON is the second reference.

Read-only: no mutation endpoints in this story, and trailmap still is not the
writer.

## Acceptance criteria

- `ready`, `next-bundle`, `list`, `show` and `touching` are served as JSON.
- Responses match `readmodel.ts`'s shapes field for field, verified by diffing
  against the published `index.json` for the full RFC set.
- The API binds to loopback and is not reachable from the public hostname.
- A health endpoint exists for the restart policy the RFC's availability
  decision depends on.
