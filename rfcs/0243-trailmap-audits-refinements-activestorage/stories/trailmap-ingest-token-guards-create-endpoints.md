---
title: "trailmap: a bearer token guards the ingest create endpoints"
status: ready
updated: 2026-11-18
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: audits
packages: ["actionpack"]
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

**Lands in:** trailmap.

## Context

trailmap's machine API is `ApiController`
(`app/controllers/api-controller.ts:25-31`), which includes `LoopbackOnly`
(`app/controllers/concerns/loopback-only.ts`) and skips forgery protection
because the CLI has no session. No endpoint checks a credential today, and no
controller reads `process.env`. The operator ruled on 2026-11-18 that the
ingest create endpoints (`POST /audits`, `POST /rfc-refines`) also require a
bearer token (RFC 0243, Decision 2). The writers are trails
`.claude/skills/audit-report/run.sh` and the tasks repo's
`scripts/rfc-refine-done.sh`, both on the box. The CLI's and ringo's existing
API calls stay token-free.

## Acceptance criteria

- [ ] An `IngestToken` concern, included by the create controllers only,
      reads `Authorization: Bearer <t>` and compares it in constant time
      with `TRAILMAP_INGEST_TOKEN`. A missing or wrong token is a 401 with
      no body detail. An unset `TRAILMAP_INGEST_TOKEN` refuses every request
      (fail closed), and boot logs a warning.
- [ ] `LoopbackOnly` still runs first: a proxied request with a valid token
      is still refused.
- [ ] `docs/deploy.md` says how to provision it: `dokku config:set trailmap
TRAILMAP_INGEST_TOKEN=…` and the same value in
      `~/.config/trailmap/ingest-token` (mode 0600) for the writers.
- [ ] Controller tests cover valid, missing, wrong and unset-env tokens.
